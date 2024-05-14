import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const bucketName = "health-check-c7ed30df-37dd-4dac-84a7-8b8184c3f0f7";
const appDomain = `${bucketName}.brainshare.io`;

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket(bucketName, {
  website: {
    indexDocument: "index.html", // Assuming 'index.html' is your default document
    errorDocument: "error.html", // Optional: Specify an error document
  },
});

// Setting the Public Access Block configuration to allow public access
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "publicAccessBlock",
  {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  },
);

const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: bucket.id,
  policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `${bucket.arn}/*`,
      }],
    }),
}, { dependsOn: publicAccessBlock });

const indexFile = new aws.s3.BucketObject("indexFile", {
  bucket: bucket.id,
  key: "index.html",
  source: new pulumi.asset.FileAsset("health_check/index.html"),
  contentType: "text/html",
});

const errorFile = new aws.s3.BucketObject("errorFile", {
  bucket: bucket.id,
  key: "error.html",
  source: new pulumi.asset.FileAsset("health_check/error.html"),
  contentType: "text/html",
});

const usEast1Provider = new aws.Provider("default", {
  region: "us-east-1",
});

const certificate = new aws.acm.Certificate("certificate", {
  domainName: "*.brainshare.io",
  validationMethod: "DNS",
}, { provider: usEast1Provider });

const distribution = new aws.cloudfront.Distribution("bucket-distribution", {
  enabled: true,
  defaultRootObject: "index.html",
  origins: [{
    domainName: bucket.websiteEndpoint,
    originId: bucket.arn,
    customOriginConfig: {
      httpPort: 80,
      httpsPort: 443,
      originProtocolPolicy: "http-only",
      originSslProtocols: ["TLSv1", "TLSv1.1"],
    },
  }],
  defaultCacheBehavior: {
    targetOriginId: bucket.arn,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD"],
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
  },
  restrictions: {
    geoRestriction: {
      restrictionType: "whitelist",
      locations: ["US"],
    },
  },
  viewerCertificate: {
    acmCertificateArn: certificate.arn,
    sslSupportMethod: "sni-only",
  },
  aliases: [appDomain],
});

// Create a Route53 Hosted Zone
const zone = new aws.route53.Zone("brainshare-io", {
  name: "brainshare.io",
});

const record = new aws.route53.Record("bucket-record", {
  zoneId: zone.zoneId,
  name: appDomain,
  type: "A",
  aliases: [{
    name: distribution.domainName,
    zoneId: distribution.hostedZoneId,
    evaluateTargetHealth: true,
  }],
});

// New apps will get a bucket, bucket policy, distribution, and a record in Route53
