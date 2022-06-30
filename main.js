const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const Discord = require('discord.js');
const fs = require('fs');

const { permissions } = require('./data.js')

const client = new Discord.Client({ intents: permissions });

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
const commandFiles = fs.readdirSync('./other_commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./other_commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}


//setup Routes/rest
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID),
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
console.log("Bot is starting");
client.login(TOKEN)