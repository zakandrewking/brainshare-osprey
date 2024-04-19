import { Stack } from "@/components/ui/stack";
import { H1 } from "@/components/ui/typography";

export default async function Home() {
  // const { getToken } = auth();

  // const token = await getToken({ template: "supabase" });

  // const supabase = createClient(
  //   process.env.SUPABASE_API_URL!,
  //   process.env.SUPABASE_ANON_KEY!,
  //   {
  //     auth: {
  //       persistSession: false,
  //       autoRefreshToken: false,
  //     },
  //     global: {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     },
  //   }
  // );

  // const { data: notes, error } = await supabase.from("notes").select();

  return (
    <Stack direction="col" gap={3} alignItems="start" className="p-3">
      <H1>Brainshare</H1>
      The best way to build & share Data Apps
      <br />- database included (or bring your own)
      <br />
      - build visuals that work anywhere on the web
      <br />
      - share and compose visuals
      <br />
      - responsive design for everything (w tooling)
      <br />
      - the tools you like (react, svelte, vue, d3, 3js, reactflow, etc)
      <br />
      - optional database versioning & collaboration tooling
      <br />
      - fork an app with or without data
      <br />
      - local dev for everything (just pip install; add a brainshare.toml; runs
      on sqlite or from cloud postgres; imitate gradio)
      <br />
      - allow dev on the website?
      <br />
      - export as an app any time (TODO what&apos;s the most portable api
      layer?)
      <br />
      http://www.dictybase.org/ help improve
    </Stack>
  );
}
