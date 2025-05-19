document.addEventListener("DOMContentLoaded", () => {
    const textarea = document.getElementById("autoExpandNote");
    if (textarea) {
        textarea.addEventListener("input", () => {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        });
    }

    const inputBox = document.querySelector(".input-box");
    if (inputBox) {
        inputBox.addEventListener("click", () => {
            inputBox.classList.add("input-box-shadow");
        });

        document.addEventListener("click", (event) => {
            if (!inputBox.contains(event.target)) {
                inputBox.classList.remove("input-box-shadow");
            }
        });
    }

    const resetBtn = document.querySelector("#reset-date-btn");
    const resetInput = document.querySelector("#reset-date-input");

    if (resetBtn && resetInput) {
        resetBtn.addEventListener("click", () => {
            console.log("reset btn");
            resetInput.value = "";
        });
    }
});
