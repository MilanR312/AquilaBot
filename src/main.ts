#!/user/bin/env

import { REST, Routes , Collection, EmbedBuilder, Client, GatewayIntentBits, ChatInputCommandInteraction, AutocompleteInteraction, ApplicationCommand} from "discord.js";
import * as fs from 'fs';
import * as CryptoTs from 'crypto-ts';

import { Command, SlashCommand } from "./types";

const permissions = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.GuildMessageReactions ];


const client = new Client({intents: permissions});

import * as dotenv from 'ts-dotenv';
import { pool } from "./dbs/dbs";

const env = dotenv.load({
    TOKEN: String,
    BOT_ID: String,
    TEST_GUILD_ID: String,
    TESTERS: String
});

let DEBUG = false;
process.argv.forEach( v => {
    if (v === "DEBUG"){
        DEBUG = true;
        console.log("debug mode on");
    }
});

const rest = new REST({ version: '10'}).setToken(env.TOKEN);



const commands: SlashCommand[] = [];
client.slashCommands = new Collection<string, SlashCommand>();
const commandFiles = fs.readdirSync('./src/other_commands')
                            .filter(file => file.endsWith(".ts"));




const addCommand = (command:any) => {
    commands.push(command.data.toJSON());
    client.slashCommands.set(command.data.name, command);
}

for (const file of commandFiles){
    const command = require(`./other_commands/${file}`);
    if (Array.isArray(command)){
        command.forEach( comm => addCommand(comm));
    } else {
        addCommand(command);
    }
}

const global = false;

(async () => {
    try {
        await rest.put(
            (global) 
                ? Routes.applicationCommands(env.BOT_ID)
                : Routes.applicationGuildCommands(env.BOT_ID, env.TEST_GUILD_ID),
            {body: commands},
            );
    } catch (error){
        console.log(error)
    }
})();

class vakInfo{
    name:string;
    value: string;
    constructor(name: string, val : string){
        this.name = name;
        this.value = val;
    }
};

let vakken:vakInfo[] = [];
async function updateVakken(interaction: AutocompleteInteraction){
    const query = `
    SELECT channelid, save
    FROM ugent.vakken;
    `
    const result = await pool.query(query);
    let vakken2:vakInfo[] = [];
    for (let v of result.rows){
        const vak = await interaction.guild?.channels.fetch(v.channelid);
        if (vak == null) continue;
        vakken2.push(new vakInfo(vak.name, v.channelid));
    }
    vakken = vakken2;
    console.log(vakken);
}


client.on('interactionCreate',async interaction => {
    if (interaction.isAutocomplete()){
        await updateVakken(interaction);
        console.log("setting autocomplete");
        const focussedOption = interaction.options.getFocused(true);
        
        var filteredData = vakken.filter((choice:any) => choice.name.startsWith(focussedOption.value));
        let filtered = filteredData.map((val) => ({name: val.name, value: val.value}));
        if (filtered.length > 25) {
            filtered = filtered.slice(0,25);
        }
        interaction.respond(filtered);
        return;
    }
    if (!interaction.isCommand()) return;

    let isTester = env.TESTERS.split(" ").includes(interaction.user.id);
    console.log(`isTester == ${isTester}`);
    if (DEBUG && !isTester) {
        //quick return for debug testing
        await interaction.reply({content: "DEBUG mode is turned on and commands are restricted"});
        return;
    }

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

import {createPoll} from "./helper/pollCreator";
client.on("messageCreate", async (message) => {

    if (message.content.includes("@MilanR#7824 ")){
        message.member?.timeout(60);
    }

    if (message.author.bot) return;
    if (!message.content.startsWith("Aquila")) return;

    await createPoll(message);
})

client.on("ready", async (stream) => {
    let chan:any = await client.channels.cache.get("1015961960786964583")
    chan.send("<@615636564692828163>");
})

console.log("bot is starting");
client.login(env.TOKEN);