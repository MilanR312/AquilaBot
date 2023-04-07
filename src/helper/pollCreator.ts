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
            await message.react(emojiLookup[i])
        }
    }
}
class mainData{
    title: string;
    description: string;
    constructor(pollobj: any){
        this.title = pollobj.title;
        this.description = pollobj.description;
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
    title:string;
    description: string;
    children:poll[];
    constructor(pollobj: any){
        this.title = pollobj.main.title;
        this.description = pollobj.main.description;
        this.children = pollobj.children.map((v:any) => {
            //v is of type [index, child] should probabily remove the index
            return new poll(v[1]);
        });
    }

    toEmbed() {
        let polls:EmbedBuilder[] = [];

        polls.push(new EmbedBuilder()
            .setTitle(this.title)
            .setDescription(this.description)
        );
        const otherPolls = this.children.map((child) => {
            const answers = child.answers.map((ell, index) => {
                return {
                    name: `${String.fromCharCode(index+65)}`,
                    value: `ell`,
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

    let polls = pollObject.toEmbed();

    PrintEmbedsFromMessage(message, polls);
    
}