updates_host=${UPDATES_HOST?};
api_host=${RUMBA_HOST?};

most_recent_update=`curl --fail $updates_host/rumba-bcd-updates/bcd-updates.json | jq -r '[.browsers[].releases[] | select(.status == "current")] | max_by(.release_date) | .release_date'`
most_recent_api_release=`curl --fail $api_host/api/v2/updates/ | jq -r '.data[0].release_date'`
if [ $(date -d $most_recent_update +%s) -gt $(date -d $most_recent_api_release +%s) ]; 
    then 
        echo "$most_recent_update is more recent than $most_recent_api_release";
        curl --fail -X POST $api_host/admin-api/v2/updates/ --header "Authorization: Bearer $RUMBA_AUTH"
    else
        echo "$most_recent_update is not more recent than $most_recent_api_release. Finished!";
fi
