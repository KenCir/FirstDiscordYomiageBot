require('dotenv').config();
const fs = require('fs');
const { exec } = require('child_process');
const { inspect } = require('util');
const { Client, MessageEmbed, Collection, Message, WebhookClient } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const client = new Client();
const queue = {};
const playflags = new Collection();
const staffs = ['714455926970777602'];

client.once('ready', () => {
    client.user.setPresence({ activity: { name: `${process.env.PREFIX}help ${client.guilds.cache.size} servers`, type: 'PLAYING' }, status: 'online' });
    console.log(`Logged in as ${client.user.tag}`);
})

client.on('message', async message => {
    if (message.author.bot) return;
    if (message.content.startsWith(process.env.PREFIX)) {
        const [command, ...args] = message.content.slice(process.env.PREFIX.length).split(' ');

        if (command === 'help') {
            message.reply(
                {
                    embeds: [
                        new MessageEmbed()
                            .setTitle(`${client.user.tag} help`)
                            .setDescription('このBotはボイスチャンネルで読み上げるBotです\nまだ開発段階であるため、音声の指定や辞書機能は使えません＾＾；')
                            .addField(`${process.env.PREFIX}join`, '読み上げを開始します')
                            .addField(`${process.env.PREFIX}leave`, '読み上げを停止します')
                            .addField(`${process.env.PREFIX}add`, '読み上げチャンネルを追加します')
                            .addField(`${process.env.PREFIX}remove`, '読み上げチャンネルを減らします')
                            .addField(`${process.env.PREFIX}ping`, 'Ping')
                            .setColor('RANDOM')
                            .setTimestamp()
                    ],
                    allowedMentions: {
                        repliedUser: false
                    }
                }
            )
        }
        else if (command === 'join') {
            if (queue[message.guild.id]) return message.reply(
                {
                    embeds: [
                        new MessageEmbed()
                            .setDescription(`現在${message.guild.me.voice.channel.name}で読み上げ中です！`)
                            .setColor('RANDOM')
                            .setTimestamp()
                    ],
                    allowedMentions: {
                        repliedUser: false
                    }
                }
            );
            else if (!message.member.voice.channelId) return message.reply(
                {
                    embeds: [
                        new MessageEmbed()
                            .setDescription(`ボイスチャンネルに参加していないとこのコマンドは使用できません`)
                            .setColor('RANDOM')
                            .setTimestamp()
                    ],
                    allowedMentions: {
                        repliedUser: false
                    }
                }
            );

            const connection = joinVoiceChannel({
                channelId: message.member.voice.channelId,
                guildId: message.guildId,
                adapterCreator: message.channel.guild.voiceAdapterCreator,
            });
            queue[message.guild.id] = {
                channel: [message.channel.id],
                queue: []
            };

            message.channel.send(
                new MessageEmbed()
                    .setDescription(`${message.member.voice.channel.name}で読み上げを開始しました！`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );
        }
        else if (command === 'leave') {
            if (!queue[message.guild.id]) return message.channel.send(
                new MessageEmbed()
                    .setDescription('このサーバーで読み上げは行われていませんよ？')
                    .setColor('RANDOM')
                    .setTimestamp()
            );
            else if (message.member.voice.channelID !== message.guild.me.voice.channelID) return message.channel.send(
                new MessageEmbed()
                    .setDescription(`Botと同じボイスチャンネルに参加していないとこのコマンドは使用できません`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );

            message.guild.me.voice.channel.leave();
            delete queue[message.guild.id];
            message.channel.send(
                new MessageEmbed()
                    .setDescription(`読み上げを終了しました`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );
        }
        else if (command === 'add') {
            if (!queue[message.guild.id]) return message.channel.send(
                new MessageEmbed()
                    .setDescription('このサーバーで読み上げは行われていませんよ？')
                    .setColor('RANDOM')
                    .setTimestamp()
            );
            else if (!message.member.voice.channelID) return message.channel.send(
                new MessageEmbed()
                    .setDescription(`ボイスチャンネルに参加していないとこのコマンドは使用できません`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );
            else if (queue[message.guild.id].channel.includes(message.channel.id)) return message.channel.send(
                new MessageEmbed()
                    .setDescription(`このチャンネルは既に読み上げ対象チャンネルです`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );

            queue[message.guild.id].channel.push(message.channel.id);
            message.channel.send(
                new MessageEmbed()
                    .setDescription(`${message.channel.name}を読み上げチャンネルに追加しました！`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );
        }
        else if (command === 'remove') {
            if (!queue[message.guild.id]) return message.channel.send(
                new MessageEmbed()
                    .setDescription('このサーバーで読み上げは行われていませんよ？')
                    .setColor('RANDOM')
                    .setTimestamp()
            );
            else if (!message.member.voice.channelID) return message.channel.send(
                new MessageEmbed()
                    .setDescription(`ボイスチャンネルに参加していないとこのコマンドは使用できません`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );
            else if (!queue[message.guild.id].channel.includes(message.channel.id)) return message.channel.send(
                new MessageEmbed()
                    .setDescription(`このチャンネルは読み上げ対象チャンネルではありません！`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );

            queue[message.guild.id].channel = queue[message.guild.id].channel.filter(channel => channel !== message.channel.id);
            message.channel.send(
                new MessageEmbed()
                    .setDescription(`${message.channel.name}を読み上げチャンネルから削除しました！`)
                    .setColor('RANDOM')
                    .setTimestamp()
            );
        }
        else if (command === 'ping') {
            const used = process.memoryUsage();
            message.channel.send('Pong')
                .then(msg => msg.edit('',
                    new MessageEmbed()
                        .setDescription(`APIPing: ${msg.createdTimestamp - message.createdTimestamp}ms\nWebSocketPing: ${client.ws.ping}ms\nメモリ使用率: ${Math.round(used.rss / 1024 / 1024 * 100) / 100}MB\n現在読み上げを行っているサーバー数: ${Object.keys(queue).length}Servers`)
                        .setColor('RANDOM')
                        .setTimestamp()
                ));
        }
        else if (command === 'eval') {
            if (!staffs.includes(message.author.id)) return message.reply('そのコマンドを実行するための権限が足りていません！');
            const msg = await message.channel.send('```以下のコードを実行してもいいですか？\n実行していい場合はokを、キャンセルする場合はnoを送信してください\n30秒経つと強制キャンセルされます```\n```js\n' + args.join(' ') + '\n```');
            while (true) {
                const filter = msg => msg.author.id === message.author.id;
                const collected = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
                const response = collected.first();
                if (!response) {
                    msg.delete();
                    break;
                }
                if (response.content === 'ok') {
                    response.delete();
                    let evaled;
                    try {
                        evaled = await eval(args.join(' '));
                        const evalinsoext = inspect(evaled).length;
                        message.react('✅');
                        if (evalinsoext <= 2000) {
                            msg.edit(inspect(evaled), { code: true });
                        }
                    }
                    catch (error) {
                        message.react('❌');
                        msg.edit(error, { code: true });
                    }
                    break;
                }
                else if (response.content === 'no') {
                    response.delete();
                    msg.delete();
                    break;
                }
            }
        }
    }
    else if (queue[message.guild.id]) {
        if (queue[message.guild.id].channel.includes(message.channel.id)) {
            if (!fs.existsSync(`dat/texts/${message.guild.id}`)) {
                fs.mkdirSync(`dat/texts/${message.guild.id}`);
            }
            if (!fs.existsSync(`dat/voices/${message.guild.id}`)) {
                fs.mkdirSync(`dat/voices/${message.guild.id}`);
            }

            // txtを記録する
            const text = message
                .content
                .replace(/https?:\/\/\S+/g, 'URL省略')
                .replace(/<a?:.*?:\d+>/g, '絵文字省略')
                .replace(/<@!?.*?>/g, 'メンション省略')
                .replace(/<#.*?>/g, 'メンション省略')
                .replace(/<@&.*?>/g, 'メンション省略');

            fs.writeFile(`dat/texts/${message.guild.id}/${message.id}.txt`, text, function (err) {
                if (err) return;

                exec(`open_jtalk \-x /var/lib/mecab/dic/open-jtalk/naist-jdic \-m ~/MMDAgent_Example-1.7/Voice/mei/mei_normal.htsvoice \-ow dat/voices/${message.guild.id}/${message.id}.wav dat/texts/${message.guild.id}/${message.id}.txt`, (err, stdout, stderr) => {
                    if (err) {
                        // エラーが発生したらそのwavとtxtはけす
                        fs.unlink(`dat/voices/${message.guild.id}/${message.id}.wav`, function (err) {
                            if (err) console.error(err);
                        });
                        fs.unlink(`dat/texts/${message.guild.id}/${message.id}.txt`, function (err) {
                            if (err) console.error(err);
                        });
                        return console.error(err);
                    }
                    queue[message.guild.id].queue.push(message.id);
                    if (!playflags.get(message.guild.id)) {
                        yomiage(message);
                    }
                    playflags.set(message.guild.id, true);
                });
            });
        }
    }
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (!queue[oldMember.guild.id]) return;
    if (oldMember.guild.me.voice.connection.channel.members.array().length > 1) return;
    oldMember.guild.me.voice.channel.leave();
    oldMember.guild.channels.cache.get(queue[oldMember.guild.id].channel[0]).send(
        new MessageEmbed()
            .setDescription(`誰も居なくなったため、読み上げを終了しました`)
            .setColor('RANDOM')
            .setTimestamp()
    );
    delete queue[oldMember.guild.id];
})

/**
 * @param {Message} message 
 */

function yomiage(message) {
    try {
        const messageid = queue[message.guild.id].queue[0];
        message.guild.voice.connection.play(`dat/voices/${message.guild.id}/${messageid}.wav`)
            .on('finish', info => {
                fs.unlink(`dat/voices/${message.guild.id}/${messageid}.wav`, function (err) {
                    if (err) console.error(err);
                });
                fs.unlink(`dat/texts/${message.guild.id}/${messageid}.txt`, function (err) {
                    if (err) console.error(err);
                });
                queue[message.guild.id].queue.shift();
                if (queue[message.guild.id].queue.length < 1) {
                    playflags.set(message.guild.id, false);
                    return;
                }
                yomiage(message);
            })
            .on('error', error => {
                message.channel.send('読み上げ中にエラーが発生しました。');
                console.error(error);
            })
    } catch (error) {
        message.channel.send('読み上げ中にエラーが発生しました。');
        console.error(error);
    }
    finally {

    }

}

process.on('unhandledRejection', (reason, promise) => {
    try {
        const webhook = new WebhookClient('843419401733537803', '9AAIlUD5E-W9hZVNPgXwjGpTFbH7HjLzgLdJQgR_FFlU5MspyovWIU4YrfZCc06BTMkv');
        webhook.send(error.stack, { code: true, split: true });
    } catch (error) { }
})

client.login()
    .catch(error => {
        console.error(error);
        process.exit(-1);
    });