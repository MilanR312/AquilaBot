const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const Discord = require('discord.js');
const fs = require('fs');
const CryptoJS = require('crypto-js')
const { MessageEmbed } = require('discord.js');

const { permissions } = require('./data.js')

const client = new Discord.Client({ intents: permissions });

const { PrintEmbedsFromMessage} = require('./other_commands/PollData/PollBuild')

//setup and get all dotenv data
const dotenv = require('dotenv');
dotenv.config();
const TOKEN = process.env['TOKEN'];
const CLIENT_ID = process.env['BOT_ID']
const TEST_GUILD_ID = process.env['TEST_GUILD_ID'];

//startup rest
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

//get all commands from files
const commands = [];
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./other_commands').filter(file => file.endsWith(".js"));


console.log(commandFiles)

function addCommand(command){
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command)
}

for (const file of commandFiles) {
    const command = require(`./other_commands/${file}`);
    console.log(command)
    if (Array.isArray(command)){
        for (const subcom of command){
            addCommand(subcom)
        }
    } else {
        addCommand(command)
    }
    
}
//console.log(commands);

const global = true;

//setup Routes/rest for local or global server
(async () => {
    try {
        await rest.put(
            (global) ? Routes.applicationCommands(CLIENT_ID) : Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID),
            { body: commands },
        );
    } catch (error) {
        console.error(error);
    }
})();




console.log("setup completed")

//interaction event loop
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});
client.on("messageCreate", (message) => {
    if (message.author.bot) return false
    if (!message.content.startsWith("Aquila")) return false
    var chan = message.channel
    data = message.content.slice(6)
    message.delete();
    chan.send("received a valid poll")
    decr = CryptoJS.AES.decrypt(data, "cool")
    pollObject = JSON.parse(decr.toString(CryptoJS.enc.Utf8))
    console.log(pollObject)
    const MainPoll = pollObject.main
    polls = []
    const MainPollEmbed = new MessageEmbed()
        .setTitle(MainPoll.title)
        .setDescription(MainPoll.description)
    polls.push(MainPoll)
    const children = pollObject.children
    const OtherPolls = children.map((val => {
        [index, value] = val
        const answers = value.ansWers.map(((ell, index) => {
            const obj = {
                name : "default",
                value : "default",
                inline : true
            }
            obj.name = `${String.fromCharCode(index+65)})`
            obj.value = ell;
            return obj;
        }))
        const Subpoll = new MessageEmbed()
            .setTitle(value.main.title)
            .setDescription(value.main.description)
            .setFields(answers)
        return Subpoll
    }))
    polls.push(...OtherPolls)
    PrintEmbedsFromMessage(chan, polls, false)
})

console.log("Bot is starting");
client.login(TOKEN)