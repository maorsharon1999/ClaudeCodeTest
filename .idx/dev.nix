{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20 # Added Node.js
    pkgs.firebase-tools # Added Firebase CLI
  ];
  # Sets environment variables in the workspace
  env = {};
  # Fast way to run scripts.
  # Use "pkgs.hello" for a quick test.
  # To remove a script, just remove it from the list.
  scripts = {};
}
