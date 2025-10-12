export function logNeedAuth() {
  console.warn("🔐 iMessage Database Access Issue:");
  console.warn(
    "   This app needs Full Disk Access permission to read iMessage data."
  );
  console.warn("   To enable it:");
  console.warn("   1. Open System Settings");
  console.warn("   2. Go to Privacy & Security > Full Disk Access");
  console.warn("   3. Add your terminal app (Terminal.app or iTerm2)");
  console.warn("   4. Restart your terminal and try again");

  return "Permission denied: Need Full Disk Access to read iMessage database";
}
