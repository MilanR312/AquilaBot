#!/user/bin/env

import { REST, Routes , Collection, EmbedBuilder, Client, GatewayIntentBits, ChatInputCommandInteraction, AutocompleteInteraction, ApplicationCommand, ActivityType} from "discord.js";
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
        let globalCommands:SlashCommand[] = (global) ? commands : [];
        let localCommands:SlashCommand[] = (!global) ? commands: [];
        
        await rest.put(
            Routes.applicationCommands(env.BOT_ID),
            {body: globalCommands}
            );
        await rest.put(
            Routes.applicationGuildCommands(env.BOT_ID, env.TEST_GUILD_ID),
            {body: localCommands}
        );
    } catch (error){
        console.log(error)
    }
})();


import { answerAutocomplete } from "./other_commands/saveAnswerSubCommands/autocomplete";
client.on('interactionCreate',async interaction => {
    if (interaction.isAutocomplete()){
        const subCommand = interaction.commandName;
        switch (subCommand){
            case 'answer': 
                await answerAutocomplete(interaction);
            break
        }
        return;
    }
    if (!interaction.isCommand()) return;

    let isTester = env.TESTERS.split(" ").includes(interaction.user.id);
    if (DEBUG && !isTester) {
        //quick return for debug testing
        await interaction.reply({content: "DEBUG mode is turned on and commands are restricted"});
        return;
    }

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;
    console.log(`${interaction.user.username} + ${interaction.commandName}`);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

import {createPoll} from "./helper/pollCreator";
let i = 1;
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("Aquila")) return;
    if (message.author.id == "340776926912446464"){
        message.channel.send("get trolled");
        message.member?.timeout(i*60*1000); //1 minute mute funny
        console.log("trolled");
        i++;
        message.delete();
        return;
    }
    await createPoll(message);
});

client.once("ready", async (stream) => {
    if (DEBUG) {
        client.user?.setPresence({
            status:"online",
            activities: [
                {
                    name: "DEBUG"
                }
            ]
        })
    } else {
        client.user?.setPresence({
            status: "online",
            activities: [
            {
                name: "/help",
                type: ActivityType.Competing
            }]
        })
    }
    
});
console.log("bot is starting");
client.login(env.TOKEN);