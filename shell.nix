let
  pkgs = import <nixpkgs> {};
  unstablePkgs = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/3c15feef7770eb5500a4b8792623e2d6f598c9c1.tar.gz";
  }) {};
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
    unstablePkgs.bun
    pkgs.rustup       # Rust (via rustup)
    pkgs.ninja
    pkgs.clang
    pkgs.libclang
    pkgs.cargo-fuzz
    pkgs.napi-rs-cli
  ] ++ raylibLinuxDeps;
  nativeBuildInputs = [ 
    pkgs.pkg-config
  ];
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath buildInputs;
}

