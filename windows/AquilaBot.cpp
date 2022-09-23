#include <iostream>
#include <string>
#include <vector>
#include <stdlib.h>

int main(int argc,char **argv){
    std::vector<std::string> flags;
    if (argc > 1) flags.assign(argv+1, argv+argc);
    system("cd .. && start cmd.exe @cmd /k node .");
}