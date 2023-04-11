import { DMChannel, Embed, EmbedBuilder, Message, NewsChannel, PartialDMChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { AES, enc} from "crypto-ts"


const emojiLookup = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾","🇿"]
async function PrintEmbedsFromMessage(message: Message<boolean>, polls:EmbedBuilder[]){
    let channel = message.channel;
    const [main, ...rest] = polls;
    await channel.send({ embeds: [main]})
    for (const element of rest){
        //for every subpoll send it and add the required reactions
        const embedMessage = await channel.send({embeds: [element]});
        if (!element.data.fields) continue;
        for (let i = 0; i < element.data.fields.length; i++){
            console.log(`added reaction ${i}`)
            await embedMessage.react(emojiLookup[i])
        }
    }
}
let isEmpty = (str:string) => str == "" ? "empty string idiot" : str;
class mainData{
    title: string;
    description: string;
    constructor(pollobj: any){
        this.title = isEmpty(pollobj.title);
        this.description = isEmpty(pollobj.description);
    }
}
class poll{
    data: mainData;
    answerAmount: Number;
    answers:string[];
    constructor(pollobj:any){
        this.data = new mainData(pollobj.main);
        this.answerAmount = pollobj.answerAmount;
        this.answers = pollobj.ansWers;
    }
}

class pollOwner{
    data: mainData;
    children:poll[];
    constructor(pollobj: any){
        this.data = new mainData(pollobj.main);
        this.children = pollobj.children.map((v:any) => {
            //v is of type [index, child] should probabily remove the index
            return new poll(v[1]);
        });
    }

    toEmbed(message: Message<boolean>) {
        let polls:EmbedBuilder[] = [];

        polls.push(new EmbedBuilder()
            .setTitle(this.data.title)
            .setDescription(this.data.description)
            .setAuthor({
                name: message.member?.nickname ?? message.author.username,
                iconURL: message.author.avatarURL() ?? undefined
            })
        );
        const otherPolls = this.children.map((child) => {
            const answers = child.answers.map((ell, index) => {
                return {
                    name: `${String.fromCharCode(index+65)}`,
                    value: `${ell}`,
                    inline: true
                };
            });
            return new EmbedBuilder()
                .setTitle(child.data.title)
                .setDescription(child.data.description)
                .setFields(answers);
        })
        polls.push(...otherPolls);
        return polls;
    }
}
export async function createPoll(message: Message<boolean>){
    //let channel = message.channel;
    //delete the prefix aquila and delete the message
    let data = message.content.slice(6); 
    message.delete();
    
    //encrypting only to defer users from changing random values to "see what happens"
    let decr = AES.decrypt(data, "cool");
    let pollObject = new pollOwner(JSON.parse(decr.toString(enc.Utf8)));

    let polls = pollObject.toEmbed(message);

    PrintEmbedsFromMessage(message, polls);
    
}