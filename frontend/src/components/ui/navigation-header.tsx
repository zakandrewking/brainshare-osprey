import ModeToggle from "@/app/DarkModeToggle";

import { NavigationButtonWithDrawer } from "./navigation-drawer";
import { FillSpace, Stack } from "./stack";
import LogOut from "@/components/ui/log-out";

function NavigationHeader() {
  return (
    <div className="h-16">
      <Stack
        direction="row"
        spacing={2}
        component="header"
        className="sticky p-3 top-0 z-50 w-full h-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <NavigationButtonWithDrawer />
        <h1>Brainshare -- Osprey edition</h1>
        <FillSpace />
        <ModeToggle />
        <LogOut />
      </Stack>
    </div>
  );
}
export { NavigationHeader };
