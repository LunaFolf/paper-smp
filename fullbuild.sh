#/bin/sh

rm -rf builds/*

npm --prefix ~/projects/paper-smp-web run build-only
npm --prefix ~/projects/paper-smp run build

mkdir builds/bin

cp -r ~/projects/paper-smp-web/dist builds/bin/web