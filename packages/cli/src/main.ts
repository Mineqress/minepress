import * as minui from "minui"
(async () => {
    console.log(await minui.connect({
        address: "http://localhost:3000",
    }));
})();