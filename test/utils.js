export function loaded() {
    return app.client.waitForExist('.auryo', 10000)
        .waitForVisible(".loader", 10000, true);
}