%s/\v^\{"appid":(\d+),"name":"(.*)"\}$/\1   \2/
g/   $/d
%s/\v\&(amp;)?quot;/"/g
%s/\v\&(amp;)?amp;/\&/g
%s/\\"/\"/g
g/\<demo\>\s*/d
w appid_name_extracted.txt
q!
