from datetime import datetime
import os
import random
import string
from unittest.mock import DEFAULT

import boto3
from more_itertools import bucket
from pytz import UTC
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend import db, models

CERTIFICATE_ARN = os.environ.get("AWS_CERTIFICATE_ARN")
if CERTIFICATE_ARN is None:
    raise Exception("Missing environment variable AWS_CERTIFICATE_ARN")
HOSTED_ZONE_ID = os.environ.get("AWS_HOSTED_ZONE_ID")
if HOSTED_ZONE_ID is None:
    raise Exception("Missing environment variable AWS_HOSTED_ZONE_ID")
CLOUDFRONT_ZONE_ID = os.environ.get("AWS_CLOUDFRONT_ZONE_ID")
if CLOUDFRONT_ZONE_ID is None:
    raise Exception("Missing environment variable AWS_CLOUDFRONT_ZONE_ID")
DEFAULT_REGION = os.environ.get("AWS_DEFAULT_REGION")
if DEFAULT_REGION is None:
    raise Exception("Missing environment variable AWS_DEFAULT_REGION")


def _new_app_prefix():
    """random letter prefix"""
    return "".join(random.choices(string.ascii_lowercase, k=20))


def get_app_prefix(app_id: str):
    # TODO change to ~ 10 random characters, checking uniqueness
    bucket_name = app_id.replace("-", "")[:10]
    return bucket_name


async def delete_app(app_id: str, user_id: str):
    print(f"Deleting app {app_id}")


async def deploy_app(app_id: str, user_id: str):
    print(f"Deploying app {app_id}")

    # set up app prefix. we commit this to the database to ensure uniqueness and
    # continue.
    async with db.get_session_for_user(user_id) as session:
        app = (
            await session.execute(select(models.App).filter(models.App.id == app_id))
        ).scalar_one()
        prefix = app.prefix
        if prefix is None:
            prefix = _new_app_prefix()
            print(f"new app prefix {prefix}")
            app.prefix = prefix
            await session.commit()

    bucket_name = prefix

    print("Setting up AWS resources")

    # Create S3 bucket
    # TODO LEFT OFF check if bucket already exists
    s3 = boto3.client("s3")
    s3.create_bucket(
        Bucket=bucket_name, CreateBucketConfiguration={"LocationConstraint": DEFAULT_REGION}
    )
    print(f"Created S3 bucket: {bucket_name}")

    # Add public access block
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )

    # Add the bucket policy
    s3.put_bucket_policy(
        Bucket=bucket_name,
        Policy=f"""{{
            "Version": "2012-10-17",
            "Statement": [
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::{bucket_name}/*"
            ]
        }}""",
    )

    # see if a distribution already exists for this app
    client = boto3.client("resourcegroupstaggingapi", region_name="us-east-1")
    cloudfront = boto3.client("cloudfront")
    res = client.get_resources(
        TagFilters=[
            {"Key": "distribution_bucket_name", "Values": [bucket_name]},
        ],
    )
    if (len(res["ResourceTagMappingList"])) == 1:
        id = res["ResourceTagMappingList"][0]["ResourceARN"].split("/")[-1]
        distribution_res = cloudfront.get_distribution(Id=id)
        distribution = distribution_res["Distribution"]
        print(f"Found existing distribution {distribution['Id']}")
    elif (len(res["ResourceTagMappingList"])) == 0:
        print("Creating new distribution")
        distribution_res = cloudfront.create_distribution_with_tags(
            DistributionConfigWithTags={
                "DistributionConfig": {
                    "CallerReference": datetime.now(UTC).isoformat(),
                    "Comment": "",
                    "Enabled": True,
                    "Aliases": {"Quantity": 1, "Items": [f"{bucket_name}.brainshare.io"]},
                    "DefaultRootObject": "index.html",
                    "Origins": {
                        "Quantity": 1,
                        "Items": [
                            {
                                "Id": bucket_name,
                                "DomainName": f"{bucket_name}.s3-website-us-west-1.amazonaws.com",
                                "CustomOriginConfig": {
                                    "HTTPPort": 80,
                                    "HTTPSPort": 443,
                                    "OriginProtocolPolicy": "http-only",
                                    "OriginSslProtocols": {
                                        "Quantity": 2,
                                        "Items": ["TLSv1", "TLSv1.1"],
                                    },
                                },
                            }
                        ],
                    },
                    "DefaultCacheBehavior": {
                        "TargetOriginId": bucket_name,
                        "ViewerProtocolPolicy": "redirect-to-https",
                        "AllowedMethods": {
                            "Quantity": 3,
                            "Items": ["GET", "HEAD", "OPTIONS"],
                            "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
                        },
                        "ForwardedValues": {"QueryString": False, "Cookies": {"Forward": "none"}},
                        "MinTTL": 0,
                        "DefaultTTL": 0,
                        "MaxTTL": 0,
                    },
                    "ViewerCertificate": {
                        "ACMCertificateArn": CERTIFICATE_ARN,
                        "SSLSupportMethod": "sni-only",
                    },
                },
                "Tags": {
                    "Items": [
                        {"Key": "distribution_bucket_name", "Value": bucket_name},
                    ]
                },
            }
        )
        distribution = distribution_res["Distribution"]
    else:
        raise ValueError("Multiple distributions found")

    # Route53 client
    route53 = boto3.client("route53")
    try:
        print("Creating new record set")
        route53.change_resource_record_sets(
            HostedZoneId=HOSTED_ZONE_ID,
            ChangeBatch={
                "Changes": [
                    {
                        "Action": "CREATE",
                        "ResourceRecordSet": {
                            "Name": f"{bucket_name}.brainshare.io",
                            "Type": "A",
                            "AliasTarget": {
                                "HostedZoneId": CLOUDFRONT_ZONE_ID,
                                "DNSName": distribution["DomainName"],
                                "EvaluateTargetHealth": True,
                            },
                        },
                    }
                ]
            },
        )
    except Exception as e:
        if "it already exists" in str(e):
            print("Record set already exists")
        else:
            raise

    print(f"App {app_id} deployed at {distribution['DomainName']}")
