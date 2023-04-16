import { ChatInputCommandInteraction, Embed, EmbedBuilder, SlashCommandBuilder } from "discord.js";


module.exports = {
    data: new SlashCommandBuilder()
                .setName("help")
                .setDescription("helps you")
    , async execute(interaction: ChatInputCommandInteraction){
        console.log(`${interaction.user.username} helpmenu`);
        let embeds:EmbedBuilder[] = [];

        //add colors per help page to help differentiate
        //add images if possible

        //create default page
        embeds.push(new EmbedBuilder()
            .setTitle("help menu")
            .setDescription("list of all the help menus")
        )

        //profile help
        embeds.push(new EmbedBuilder()
            .setTitle("profile")
            .addFields({name:"/profile",value:"show your profile"})
            .addFields({name:"/bal", value:"show how much points you have"})
            .addFields({name:"/baltop", value:"shows the user with the most points"})
        )

        //answer help
        embeds.push(new EmbedBuilder()
            .setTitle("answers")
            .addFields({name:"/answer save", value:`allows the user to save an answer, 
                each answer gives 2 points to the person that send the answer and 2 points to the user who saved the answer
                
                when saving add following options
                vak: (kanaalNaam / autocomplete)
                hoofdstuk (1, 25, examen)
                oef (2e, 5.1, 5.2.1, 8.6e, samenvatting)
                `})
            .addFields({name:"/answer get", value:`allows the user to get an answer, provide the same options as mentiont at /answer save`})
            .addFields({name:"/answer list", value:"show how many answer a specific vak/hoofdstuk/oefening has based on the amount of input parameters !undergoing rewrite!"})
        )

        //poll help
        embeds.push(new EmbedBuilder()
            .setTitle("poll")
            .addFields({name: "polls", value:`the creation of polls is possible at https://milanr312.github.io/
                to post the poll in discord click get the string to copy the poll to clipboard, then paste it in the channel where you want it
            `})
        )
        interaction.reply({embeds: embeds});
    }
}