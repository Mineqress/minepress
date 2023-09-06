let
  pkgs = import <nixpkgs> {};
  raylibLinuxDeps = with pkgs; [
    mesa
    mesa.drivers
    libGL
    alsa-lib
    pulseaudio
    libvorbis
    libogg
    cmake
  ] ++ (with pkgs.xorg; [
    libpthreadstubs
    libX11.dev
    libXrandr.dev
    libXinerama.dev
    libXcursor.dev
    libXi.dev
  ]);
in
pkgs.mkShell rec {
  buildInputs = [
    pkgs.nodejs_20  # Node.js
    pkgs.rustup       # Rust (via rustup)
    pkgs.nodePackages.pnpm  # pnpm package manager
    pkgs.ninja
    pkgs.clang
    pkgs.libclang
  ] ++ raylibLinuxDeps;
  nativeBuildInputs = [ 
    pkgs.pkg-config
  ];
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath buildInputs;
  shellHook = ''
    # Install Nx globally (replace with the Nx version you need)
    if ! command -v <the_command> &> /dev/null
    then
      pnpm -g add nx
    fi
  '';
}

