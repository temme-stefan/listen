#/bin/bash

# Define input files
HTML_FILE="index.html"
CSV_FILE="links.csv"

# Define start and end markers for the replacement
START_MARKER="\/\/startData"
END_MARKER="\/\/endData"

# Read content of links.csv and wrap it with backticks
CSV_CONTENT=$(cat "$CSV_FILE")
WRAPPED_CONTENT="\`$CSV_CONTENT\`"

# Use sed to replace the content between the markers
sed -i "/$START_MARKER/,/$END_MARKER/ {
    /$START_MARKER/ {p; r /dev/stdin
    d}
    /$END_MARKER/ p
    d
}" "$HTML_FILE" <<< "$WRAPPED_CONTENT"



ssh u106909590@access895651998.webspace-data.io "rm -rf ~/staticSites/liste/artur2025/*" && scp -r index.html img "u106909590@access895651998.webspace-data.io:~/staticSites/liste/artur2025/"
