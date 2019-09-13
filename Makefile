all: index.html kappaleiden-nimet.txt

index.html: index-runko preamble
	sed -e "/PREAMBLE/r preamble" -e "s///" $< > $@

kappaleiden-nimet.txt: *.org
	./generoi-kappaleiden-nimet
