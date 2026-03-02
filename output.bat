#!/bin/bash

OUTPUT="output.txt"

# ürítjük a kimeneti fájlt
> "$OUTPUT"

# fájlok gyűjtése (css + js + root html)
FILES=$(
  {
    find css -type f 2>/dev/null
    find js -type f 2>/dev/null
    find . -maxdepth 1 -type f -name "*.html"
  } | sort -u
)

for file in $FILES
do
    # .gitattributes kihagyása
    if [[ "$(basename "$file")" == ".gitattributes" ]]; then
        continue
    fi

    # .github mappa teljes kizárása (biztonsági check)
    if [[ "$file" == ./.github/* ]]; then
        continue
    fi

    echo "********************************************" >> "$OUTPUT"
    echo "********************************************" >> "$OUTPUT"
    echo "$(basename "$file")" >> "$OUTPUT"
    echo "********************************************" >> "$OUTPUT"
    echo "********************************************" >> "$OUTPUT"

    cat "$file" >> "$OUTPUT"
    echo -e "\n" >> "$OUTPUT"
done

echo "Kész! Az összes fájl tartalma az $OUTPUT fájlba került."
