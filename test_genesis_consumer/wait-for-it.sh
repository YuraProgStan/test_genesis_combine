#!/bin/sh

# wait-for-it.sh: wait for a service to become available
# original script: https://github.com/vishnubob/wait-for-it

TIMEOUT=15
QUIET=0
WAITFORIT_cmdname=${0##*/}

echoerr() { if [ "$QUIET" -ne 1 ]; then echo "$@" 1>&2; fi }

usage()
{
    cat << USAGE >&2
Usage:
    $WAITFORIT_cmdname host:port [-s] [-t timeout] [-- command args]
    -h HOST | --host=HOST       Host or IP under test
    -p PORT | --port=PORT       TCP port under test
                                Alternatively, you specify the host and port as host:port
    -s | --strict               Only execute subcommand if the test succeeds
    -q | --quiet                Don't output any status messages
    -t TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for()
{
    if [ "$TIMEOUT" -gt 0 ]; then
        echoerr "$WAITFORIT_cmdname: waiting $TIMEOUT seconds for $HOST:$PORT"
    else
        echoerr "$WAITFORIT_cmdname: waiting for $HOST:$PORT without a timeout"
    fi
    start_ts=$(date +%s)
    while :
    do
        if [ "$ISBUSY" = "1" ]; then
            nc -z $HOST $PORT
            result=$?
        else
            (echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1
            result=$?
        fi
        if [ $result -eq 0 ]; then
            end_ts=$(date +%s)
            echoerr "$WAITFORIT_cmdname: $HOST:$PORT is available after $((end_ts - start_ts)) seconds"
            break
        fi
        sleep 1
    done
    return $result
}

wait_for_wrapper()
{
    # In order to support SIGINT during timeout: http://unix.stackexchange.com/a/57692
    if [ "$QUIET" -eq 1 ]; then
        timeout $TIMEOUT $0 --quiet --child --host=$HOST --port=$PORT --timeout=$TIMEOUT &
    else
        timeout $TIMEOUT $0 --child --host=$HOST --port=$PORT --timeout=$TIMEOUT &
    fi
    pid=$!
    trap "kill -INT -$pid" INT
    wait $pid
    result=$?
    if [ $result -ne 0 ]; then
        echoerr "$WAITFORIT_cmdname: timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
    fi
    return $result
}

# process arguments
while [ $# -gt 0 ]
do
    case "$1" in
        *:* )
        hostport=$(echo "$1" | sed 's/:/ /')
        HOST=$(echo $hostport | cut -d' ' -f1)
        PORT=$(echo $hostport | cut -d' ' -f2)
        shift 1
        ;;
        -q | --quiet)
        QUIET=1
        shift 1
        ;;
        -s | --strict)
        STRICT=1
        shift 1
        ;;
        -h)
        HOST="$2"
        if [ "$HOST" = "" ]; then break; fi
        shift 2
        ;;
        --host=*)
        HOST="${1#*=}"
        shift 1
        ;;
        -p)
        PORT="$2"
        if [ "$PORT" = "" ]; then break; fi
        shift 2
        ;;
        --port=*)
        PORT="${1#*=}"
        shift 1
        ;;
        -t)
        TIMEOUT="$2"
        if [ "$TIMEOUT" = "" ]; then break; fi
        shift 2
        ;;
        --timeout=*)
        TIMEOUT="${1#*=}"
        shift 1
        ;;
        --child)
        CHILD=1
        shift 1
        ;;
        --)
        shift
        CMD="$@"
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [ "$HOST" = "" -o "$PORT" = "" ]; then
    echoerr "Error: you need to provide a host and port to test."
    usage
fi

TIMEOUT=${TIMEOUT:-15}
STRICT=${STRICT:-0}
ISBUSY=$(command -v nc)

if [ "$CHILD" -gt 0 ]; then
    wait_for
    result=$?
    exit $result
else
    if [ "$TIMEOUT" -gt 0 ]; then
        wait_for_wrapper
        result=$?
    else
        wait_for
        result=$?
    fi
fi

if [ "$CMD" != "" ]; then
    if [ $result -ne 0 -a $STRICT -eq 1 ]; then
        echoerr "$WAITFORIT_cmdname: strict mode, refusing to execute subprocess"
        exit $result
    fi
    exec $CMD
else
    exit $result
fi
