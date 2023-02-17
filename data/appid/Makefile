.PHONY: update
update: extract.vim
	curl "http://api.steampowered.com/ISteamApps/GetAppList/v0002/" --output data.txt
	cat data.txt | jq '.applist.apps[]' -c > appid_name_raw.txt
	vim appid_name_raw.txt -c "argdo so extract.vim"
	cat appid_name_extracted.txt | sort | uniq > appid_name.txt

.PHONY: clean
clean:
	-rm -rf data.txt appid_name_raw.txt appid_name_extracted.txt appid_name.txt
