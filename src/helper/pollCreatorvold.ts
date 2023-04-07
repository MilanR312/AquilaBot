import { Embed, EmbedBuilder, Message } from "discord.js";
import { AES, enc} from "crypto-ts"


const emojiLookup = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾","🇿"]
async function PrintEmbedsFromMessage(channel:any, data:any, eph:any){
    const [main, ...rest] = data;
    await channel.send({ embeds: [main], ephemeral: eph})
    for (const element of rest){
        //for every subpoll send it and add the required reactions
        const message = await channel.send({embeds: [element], ephemeral: eph, fetchReply: true})
        console.log(element.data.fields)
        if (eph) continue;
        for (let i = 0; i < element.data.fields.length; i++){
            console.log(`added reaction ${i}`)
            await message.react(emojiLookup[i])
        }
    }
}

export async function createPoll(message: Message<boolean>){
    let channel = message.channel;
    //delete the prefix aquila and delete the message
    let data = message.content.slice(6); 
    message.delete();

    //encrypting only to defer users from changing random values to "see what happens"
    let decr = AES.decrypt(data, "cool");
    let pollObject = JSON.parse(decr.toString(enc.Utf8));

    const MainPollEmbed = new EmbedBuilder()
        .setTitle(pollObject.main.title)
        .setDescription(pollObject.main.description);

    let polls:EmbedBuilder[] = [];
    polls.push(MainPollEmbed);

    const children = pollObject.children
    const OtherPolls = children.map(((val:any) => {
        let [index, value] = val
        const answers = value.ansWers.map(((ell:any, index:any) => {
            const obj = {
                name : "default",
                value : "default",
                inline : true
            }
            obj.name = `${String.fromCharCode(index+65)})`
            obj.value = ell;
            return obj;
        }))
        const Subpoll = new EmbedBuilder()
            .setTitle(value.main.title)
            .setDescription(value.main.description)
            .setFields(answers)
        return Subpoll
    }))
    polls.push(...OtherPolls)
    PrintEmbedsFromMessage(channel, polls, false)

}