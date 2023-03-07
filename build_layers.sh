#! /bin/bash

echo "Cleaning Layers Folder"
echo "_____________________________________"
rm -rf ./layers/*
cd layers
echo "_____________________________________"

echo "Downloading Helvetica"
echo "_____________________________________"
mkdir helvetica
cd helvetica
curl -O https://dl.freefontsfamily.com/download/Helvetica-Font
mv Helvetica-Font Helvetica-Font.zip
unzip Helvetica-Font.zip
rm Helvetica-Font.zip
rm helvetica-rounded-bold-5871d05ead8de.otf
rm Helvetica-Oblique.ttf
rm Helvetica-BoldOblique.ttf
rm helvetica-compressed-5871d14b6903a.otf
rm helvetica-light-587ebe5a59211.ttf
cd ..
echo "Helvetica downloaded"
echo "_____________________________________"