SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command 
Path = $(subst $(notdir $(CURDIR)),,$(CURDIR))

default: compile

File := AquilaBot


run: $(File).exe
	$^

compile: $(File).exe


$(File).exe: $(File).cpp
	windres -v -i $(Path)/img/Aquila.rc -o $(Path)/img/Aquila.o
	g++ -o $@ $^ $(Path)/img/Aquila.o -static
	