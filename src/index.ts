import "@utils/global";
import { Patcher } from "./modules/patcher/patcher";
import { BX_FLAGS } from "./utils/bx-flags";
import { BxLogger } from "./utils/bx-logger";
import { BxExposed } from "./utils/bx-exposed";
import { GhPagesUtils } from "./utils/gh-pages";
import { interceptHttpRequests } from "./utils/network";


window.BX_EXPOSED = BxExposed;


function main() {
    GhPagesUtils.fetchLatestCommit();

    interceptHttpRequests();

    BxLogger.info('BxFlags', BX_FLAGS);
    Patcher.init();
}

main();
