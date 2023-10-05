
import { pool } from "./../../dbs/dbs";

class vakInfo{
    name:string;
    value: string;
    constructor(name: string, val : string){
        this.name = name;
        this.value = val;
    }
};

let vakken:vakInfo[] = [];
let hoofdstukken:string[] = [];
let oef:string[] = [];
import { setInterval } from "timers";
import { AutocompleteInteraction, CacheType } from "discord.js";

async function updateVakken(interaction: AutocompleteInteraction<CacheType>) {
    const query = `
    SELECT channelid, save
    FROM ugent.vakken
    where save=true;
    `
    const result = await pool.query(query);
    let vakken2:vakInfo[] = [];
    const server = await interaction.client.guilds.fetch("978251400872075315")
    for (let v of result.rows){
        const vak = await server.channels.fetch(v.channelid);
        if (vak == null) continue;
        vakken2.push(new vakInfo(vak.name, v.channelid));
    }
    vakken = vakken2;
    console.log(vakken);  
}
let lastTimeUpdated = new Date("2023-04-15T11:00");


export async function answerAutocomplete(interaction: AutocompleteInteraction<CacheType>){
    console.log((new Date()).getHours() - lastTimeUpdated.getHours());
    if(new Date().getTime() - lastTimeUpdated.getTime() > 60*60*1000){ //update every hour
        lastTimeUpdated = new Date();
        console.log("updating vakken");
        await updateVakken(interaction);
    }
    //act first for minimum latency
    let focussed = interaction.options.getFocused(true);
    switch (interaction.options.getSubcommand()){
        case "get":
            if (focussed.name == "vak"){
                const filteredData = vakken.filter((vak) => vak.name.includes(focussed.value))
                let filtered = filteredData.map((vak) => ({name: vak.name, value: vak.value}));
                filtered = filtered.slice(0,25);
                interaction.respond(filtered);
                return;
            }

    }
    
    
}
