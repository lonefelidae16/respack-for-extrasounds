#!/bin/bash

usage() {
    cat <<EOL
Usage: $(basename $0) [TARGET_FILE.{po,pot}]
Converts PO/POT format to JSON file.
EOL
    exit
}

function join_by {
    local d=${1-} f=${2-}
    if shift 2; then
        printf %s "$f" "${@/#/$d}"
    fi
}

if [ -z "$1" ]; then
    usage
fi

main() {
    local _id=() _str=() _result=()

    while read line; do
        if echo "$line" | grep msgid &>/dev/null; then
            _id+=("$(echo "$line" | sed -r 's@msgid "(.*?)"@\1@' | sed -e 's@"@\\"@g' | sed -e 's@^@"@' | sed -e 's@$@"@')")
        fi
        if echo "$line" | grep msgstr &>/dev/null; then
            _str+=("$(echo "$line" | sed -r 's@msgstr "(.*?)"@\1@' | sed -e 's@"@\\"@g' | sed -e 's@^@"@' | sed -e 's@$@"@')")
        fi
    done < "$1"

    for i in $(seq 1 $(( ${#_id[*]} - 1 )) ); do
        _result+=("    ${_id[i]}: ${_str[i]}")
    done

    echo "{"
    join_by $',\n' "${_result[@]}"
    echo
    echo "}"
}

main "$1"
