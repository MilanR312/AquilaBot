#!/user/bin/env

import { REST, Routes , Collection, EmbedBuilder, Client, GatewayIntentBits, ChatInputCommandInteraction, AutocompleteInteraction, ApplicationCommand, ActivityType} from "discord.js";
import * as fs from 'fs';
import * as CryptoTs from 'crypto-ts';
import { ISlashCommand } from "./interfaces/ISlashCommand";

import { Command, SlashCommand } from "./types/types";
const permissions = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.GuildMessageReactions ];


const client = new Client({intents: permissions});

import * as dotenv from 'ts-dotenv';

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

import {commands, slash_commands} from "./commands/mod"
client.slashCommands = slash_commands;

const global = false;

(async () => {
    try {
        let globalCommands = (global) ? commands : [];
        let localCommands = (!global) ? commands: [];
        
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


client.on('interactionCreate',async interaction => {
    /*if (interaction.isAutocomplete()){
        const subCommand = interaction.commandName;
        switch (subCommand){
            case 'answer': 
                await answerAutocomplete(interaction);
            break
        }
        return;
    }*/
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


client.on("messageCreate", async (message) => {
    /*if (message.author.bot) return;
    if (!message.content.startsWith("Aquila")) return;
    await createPoll(message);*/
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
