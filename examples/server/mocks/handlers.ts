import { rest } from "msw";

export const handlers = [
    rest.post('/error/upload', (req, res, ctx) => {
        return res(
            ctx.json({
                message: '上传成功',
            }),
        );
    }),
    rest.get('/normal', (req, res, ctx) => {
        return res(
            ctx.json({
                code: 200,
                message: '这是正常接口',
            }),
        );
    }),
];
