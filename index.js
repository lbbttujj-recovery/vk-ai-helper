require('dotenv').config()
const { VK, Keyboard} = require('vk-io');
const { SessionManager } = require('@vk-io/session');
const { SceneManager, StepScene } = require('@vk-io/scenes');
const gpt = require('./gptAPI')


const vk = new VK({
    token: "vk1.a.fe0QA8kyhEb1e1BOmnV4GuggXLmxbbr__U3W-FgrcDxCojqcS3jbkYbtaaT3Vpy0CE0d3ZpT2eCHRToRaKKgyTvURPSN--MqPVrBcAh5clZVA_ot7r_W6Bj0O_i1xCamCOa8TwKe_PIvyAwhjwicjSVEoHxAEZwIXAJ8Ly3CbEXxshkJw5UqF0ZZ6gK5uhVpCwmymPZcgVfzgm9ntbfl3w"
});

let isTalkMode = false

const sessionManager = new SessionManager();
const sceneManager = new SceneManager();

const startKeyboard = Keyboard.keyboard(
    [
        Keyboard.textButton({
            label: 'json_mode',
            payload: {
                command: 'mode',
                item: 'json'
            },
            color: Keyboard.POSITIVE_COLOR
        }),
        Keyboard.textButton({
            label: 'talk_mode',
            payload: {
                command: 'mode',
                item: 'talk'
            },
            color: Keyboard.POSITIVE_COLOR
        })
    ])

const gptKeyboard = Keyboard.keyboard(
    [
        Keyboard.textButton({
            label: 'stop',
            payload: {
                command: 'talkMode',
                item: 'stop'
            },
            color: Keyboard.POSITIVE_COLOR
        })
    ])


vk.updates.on('message_new', sessionManager.middleware);
vk.updates.on('message_new', sceneManager.middleware);
vk.updates.on('message_new', sceneManager.middlewareIntercept);

sceneManager.addScenes([
    new StepScene('json', [
        (ctx) => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                return ctx.send('Введите json');
            }

            ctx.scene.state.json = ctx.text;
            return ctx.scene.step.next();
        },
        (ctx) => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                return ctx.send('Какие поля изменить?. Перечисли их через запятую. Отправь "all" если все поля');
            }

            ctx.scene.state.fields = ctx.text;

            return ctx.scene.step.next();
        },
        (ctx) => {
            if (ctx.scene.step.firstTime || !ctx.text) {
                return ctx.send('Введите количество');
            }

            ctx.scene.state.count = Number(ctx.text)

            return ctx.scene.step.next();
        },
        async (ctx) => {
            const { fields, json, count } = ctx.scene.state;
            const changeFields = fields === 'all' ? 'Измени в нем все поля': `Измени в нем следюущие поля ${fields}`

            const request = `Мне нужно чтобы ты сгенерировал массив из ${count} json по этому примеру: ${json}. ${changeFields}. `
            const response = await gpt(request)

            await ctx.send(response)

            return ctx.scene.step.next(); // Automatic exit, since this is the last scene
        }
    ])
]);

vk.updates.on('message_new', async (ctx, next) => {
    if(isTalkMode){
        if (ctx.text === 'stop') {
            isTalkMode = false
            await ctx.send({message: 'Выберите режим', keyboard: startKeyboard})
        } else {
            await ctx.send(await gpt(ctx.text))
        }
    } else {
        if (ctx.text === '/signup') {
            return ctx.scene.enter('signup');
        }
        if (ctx.text === 'json_mode') {
            return ctx.scene.enter('json');
        }
        if (ctx.text === 'talk_mode') {
            await ctx.send({message: 'Ну что ж, поговорим. Спрашивай.', keyboard: gptKeyboard})
            isTalkMode = true
        }
        if (ctx.text === '/start') {
            await ctx.send({message: 'Выберите режим', keyboard: startKeyboard})
        }
    }

    return next();
});

vk.updates.start().catch(console.error);