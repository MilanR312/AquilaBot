const { EmbedBuilder, Interaction, User } = require('discord.js');

function checkUserInPoll(polls, interaction){
    const UserId = interaction.user.id;
    if (!(UserId in polls)){
        throw {name: "noActivePoll", message: "User has no active poll"}
    }
}
function checkReference(data, interaction){
    try {
        a = data.reference.messageId;
    } catch {
        throw {name: "referenceError", content: "User didn't reply to a message, shutting down edit mode"}
    }
    const botID = interaction.applicationId
    const repliedUserID = data.mentions.repliedUser.id
    if (botID != repliedUserID) throw {name: "wrongReplyError", content: "can't edit non bot poll messages"}
}
function checkEmbeds(msg){
    if (msg.embeds.length == 0) throw {name: "noEmbedError", content: "replied message does not contain an embed"}
}


module.exports = {checkUserInPoll, checkReference, checkEmbeds}