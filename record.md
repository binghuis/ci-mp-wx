asciinema rec demo.cast

cat demo.cast | perl -CS -pe 's/([\x{4e00}-\x{9fa5}]|[\x{FF00}-\x{FFEF}])/$1 /g' > demo.space.cast

agg -v --renderer=resvg --fps-cap 60 --font-size 24 demo.space.cast demo.gif
