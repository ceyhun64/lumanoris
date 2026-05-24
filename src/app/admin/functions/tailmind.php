<?php
function pageTitle($title = 'Başlık Yok', $subtitle = '')
{
    echo <<<HTML
    <section class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">{$title}</h2>
        <p class="text-gray-500 mt-1">{$subtitle}</p>
    </section>
    HTML;
}

function renderDataList($data, $active_id, $list_title, $display_key_title = 'name', $display_key_subtitle = 'code')
{
    // İçerik üretimi için temiz Heredoc bloğu
    echo <<<HTML
    <aside class="bg-white rounded-xl shadow-xl border border-gray-100 p-0 lg:p-6 h-fit top-6">
        <h3 class="text-xl font-bold text-gray-800 border-b pb-4 mb-4">{$list_title}</h3>
        <ul id="dataListUl" class="space-y-2 max-h-[700px] overflow-auto pr-2 -mr-2">
    HTML;

    foreach ($data as $item) {
        // ID kontrolü (ID alanı zorunlu varsayılmıştır)
        $item_id = (int)($item['id'] ?? 0); 
        
        // Aktif sınıfını belirleme
        $is_active = ($item_id === (int)$active_id) 
            ? 'bg-white text-indigo-700 pointer-events-none shadow shadow-indigo-200/50' 
            : 'bg-gray-100 hover:bg-indigo-100/50 text-gray-800';
        
        // Dinamik anahtarlardan güvenli içerik çekme
        $item_title_content = htmlspecialchars((string)($item[$display_key_title] ?? 'Bilinmeyen Başlık'));
        $item_subtitle_content = htmlspecialchars((string)($item[$display_key_subtitle] ?? ''));
        
        echo <<<ITEM
            <li class="flex flex-col px-4 py-3 rounded-lg cursor-pointer transition duration-200 {$is_active}" data-id="{$item_id}">
                <span class="font-bold text-lg">{$item_title_content}</span>
                <span class="text-sm text-gray-500 truncate">Kodu: {$item_subtitle_content}</span>
            </li>
        ITEM;
    }
    
    echo <<<HTML
        </ul>
    </aside>
    HTML;
}

function generalInput($type, $label, $name, $attributes = []) {
    $id = $name;
    $allowedTypes = ['text', 'email', 'number', 'date', 'datetime-local', 'url', 'tel', 'password'];

    if (!in_array($type, $allowedTypes)) {
        return "<!-- generalInput: '$type' desteklenmiyor -->\n";
    }

    $classes = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm';

    // Ek attributeları stringe çevir
    $attrString = '';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<label for="$id" class="block font-semibold text-sm text-gray-700 mb-2">$label</label>
<input type="$type" id="$id" name="$name" class="$classes"$attrString>
HTML;
}

function textareaInput($label, $name, $attributes = []) {
    $id = $name;
    $classes = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm';

    $attrString = '';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<label for="$id" class="block font-semibold text-sm text-gray-700 mb-2">$label</label>
<textarea id="$id" name="$name" class="$classes"$attrString></textarea>
HTML;
}

function fileInput($label, $name, $attributes = []) {
    $id = $name;
    $classes = 'text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer';

    $attrString = ' accept="image/png, image/jpeg"';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<label for="$id" class="block font-semibold text-sm text-gray-700 mb-2">$label</label>
<input type="file" id="$id" name="$name" class="$classes"$attrString>
HTML;
}

function imageInput($label, $name, $attributes = []) {
    $id = $name;
    $classes = 'text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer';

    $attrString = ' accept="image/*"';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<label for="$id" class="block font-semibold text-sm text-gray-700 mb-2">$label</label>
<input type="file" id="$id" name="$name" class="$classes"$attrString>
HTML;
}

function selectInput($label, $name, $attributes = []) {
    $id = $name;
    $classes = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm';

    $attrString = '';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<label for="$id" class="block font-semibold text-sm text-gray-700 mb-2">$label</label>
<select id="$id" name="$name" class="$classes"$attrString>
  <option value="">Seçiniz</option>
</select>
HTML;
}

function checkboxInput($label, $name, $attributes = []) {
    $id = $name;
    $classes = 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded';

    $attrString = '';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<div class="flex items-center gap-2">
  <input type="checkbox" id="$id" name="$name" class="$classes"$attrString>
  <label for="$id" class="text-sm font-medium text-gray-700">$label</label>
</div>
HTML;
}

function radioInput($label, $name, $attributes = []) {
    $id = $name;
    $classes = 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded';

    $attrString = '';
    foreach ($attributes as $key => $value) {
        $attrString .= " $key=\"" . htmlspecialchars($value) . "\"";
    }

    echo <<<HTML
<div class="flex items-center gap-2">
  <input type="radio" id="$id" name="$name" class="$classes"$attrString>
  <label for="$id" class="text-sm font-medium text-gray-700">$label</label>
</div>
HTML;
}

function formActionButtons($prefix = 'item') {
    $newId    = $prefix . 'NewBtn';
    $saveId   = $prefix . 'SaveBtn';
    $deleteId = $prefix . 'DeleteBtn';

    echo <<<HTML
<div class="flex justify-between gap-3 pt-4">
    <button type="button" id="$newId"
            class="flex-1 hidden bg-gray-200 text-indigo-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition duration-150">
        Yeni Ekle
    </button>
    <button type="submit" id="$saveId"
            class="flex-1 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 active:scale-95 transition duration-150 shadow-md shadow-green-500/30">
        Kaydet
    </button>
    <button type="button" id="$deleteId"
            class="flex-1 hidden bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-red-700 active:bg-red-800 active:scale-95 transition duration-150 shadow-md shadow-red-500/30">
        Sil
    </button>
</div>
HTML;
}
?>