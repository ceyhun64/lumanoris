function validatePassword(passwordId, confirmPasswordId) {
    const password = document.getElementById(passwordId).value;
    const confirmPassword = document.getElementById(confirmPasswordId).value;

    if (password.length < 8) {
        alert("Şifre en az 8 karakter olmalıdır!");
        event.preventDefault();
        return false;
    }

    if (confirmPasswordId && password !== confirmPassword) {
        alert("Şifreler eşleşmiyor!");
        event.preventDefault();
        return false;
    }

    return true;
}

function resetForm(formId,listId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll("input, textarea, select").forEach(field => {
        if (field.type === "checkbox" || field.type === "radio") {
            field.checked = false;
        } else {
            field.value = "";
        }
    });

    document.querySelectorAll(`#${listId} li`).forEach(item => {
        item.classList.remove("bg-gray-100", "border-gray-200", "hover:bg-gray-100", "hover:border-gray-200");
    });

    document.getElementById("saveOrUpdate").innerText = "Kaydet";
    document.getElementById("saveOrUpdate").onclick = null;
    document.getElementById("delete").style.display = "none";
    document.getElementById("new").style.display = 'none';
}

function deleteItem(table,itemId,endpoint,imageItemId = null) {
    if (!confirm("Bu öğeyi silmek istediğinizden emin misiniz?")) {
        return;
    }

    const formData = new FormData();
    formData.append("table", table);
    formData.append("ids", document.getElementById(itemId).value);
    if(imageItemId != null)
    {
        formData.append("guncel_resim",document.getElementById(imageItemId).value);
    }

    fetch(endpoint, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Öğe başarıyla silindi!");
            window.location.href = window.location.pathname;
        } else {
            alert("Silme işlemi başarısız: " + data.error);
        }
    })
    .catch(error => {
        alert("Bir hata oluştu: " + error);
    });
}

function updateRecord(table, rawformData) {
    const whereClause = "id=" + formData.get("id"); 
    formData.append("table",table);
    formData.append("where", whereClause);

    fetch("ajax/update.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.text()) 
    .then(data => {
        console.log(data);
        try {
            data = JSON.parse(data);
            if (data.success) {
                alert("Öge başarıyla güncellendi!");
                window.location.href = window.location.pathname;
            } else {
                alert("Güncelleme başarısız: " + data.error);
            }
        } catch (error) {
            alert("JSON dönüşüm hatası: " + error);
        }
    })
    .catch(error => {
        alert("Bir hata oluştu: " + error);
    });
}