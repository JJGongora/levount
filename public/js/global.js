function openUserMenu() {
    document.getElementById('userDrawer').classList.toggle('Open');
    document.getElementById('userOverlay').classList.toggle('Open');
}

function openLateralMenu() {
    let buttonMenu = document.getElementById("menuButton1");
    let drawer = document.getElementById("menuDrawer");

    if (drawer.classList.contains("Open")) {
        drawer.classList.remove("Open");
        buttonMenu.innerHTML=`&#xe1010;`;
    } else {
        drawer.classList.add("Open");
        buttonMenu.innerHTML=`&#xe1014;`;
    }
}