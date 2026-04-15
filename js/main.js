// OTP Crack: Crib Drag Calculator
// Core logic - preserved from original implementation

let ct1_hex_arr = [];
let ct2_hex_arr = [];
let hex1_xor_hex2 = [];
let crib_arr = [];
let result_1 = [];
let result_2 = [];

// Conversion functions
export function Hex2HexArr(st) {
  let hexString = [];
  if (st.length % 2 !== 0) {
    console.log('Odd-length string');
    return hexString;
  }
  for (let i = 0; i < st.length / 2; i++) {
    hexString[i] = st.substr(i * 2, 2);
  }
  return hexString;
}

export function ASCII2HexArr(st) {
  let hexString = [];
  for (let i = 0; i < st.length; i++) {
    hexString[i] = st.charCodeAt(i).toString(16);
  }
  return hexString;
}

export function bin2HexArr(st) {
  if (st.length % 4 !== 0) {
    console.log('Cannot divide by 4');
    return [];
  }
  let hex = parseInt(st, 2).toString(16);
  return Hex2HexArr(hex);
}

export function hex2ASCII(hexx) {
  let hex = hexx.toString();
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function hex_xor_hex(h1, h2) {
  let r = (parseInt(h1, 16) ^ parseInt(h2, 16)).toString(16);
  if (r.length === 1) {
    r = '0' + r;
  }
  return r;
}

export function hex_arr_xor_cal(hex1Arr, hex2Arr) {
  let result = [];
  let hLength = Math.max(hex1Arr.length, hex2Arr.length);
  for (let i = 0; i < hLength; i++) {
    result[i] = hex_xor_hex(hex1Arr[i], hex2Arr[i]);
  }
  return result;
}

// Initialize output textareas
export function init_result_1(hex) {
  result_1 = '.'.repeat(hex.length);
  document.getElementById('output_1').value = result_1;
}

export function init_result_2(hex) {
  result_2 = '.'.repeat(hex.length);
  document.getElementById('output_2').value = result_2;
}

// Calculate XOR of two ciphertexts
export function ct1_xor_ct2_cal() {
  let ct1 = ct1_hex_arr;
  let ct2 = ct2_hex_arr;
  if (ct1.length > 0 && ct2.length > 0) {
    hex1_xor_hex2 = hex_arr_xor_cal(ct1, ct2);
    document.getElementById('ct1_xor_ct2').value = hex1_xor_hex2;
  }
}

// Process crib word and display results
export function crib_change() {
  let cribWordElem = document.getElementById('crib_word');
  let cribWord = cribWordElem.value;

  crib_arr = ASCII2HexArr(cribWord);
  if (hex1_xor_hex2.length < 1) return;

  let resultLength = hex1_xor_hex2.length - crib_arr.length + 1;
  let result = [];
  for (let i = 0; i < resultLength; i++) {
    let x = '';
    for (let j = 0; j < crib_arr.length; j++) {
      x = x + hex_xor_hex(crib_arr[j], hex1_xor_hex2[i + j]);
    }
    result[i] = hex2ASCII(x);
  }

  let charSetElem = document.getElementById('char_set');
  let charSet = charSetElem.value || "a-zA-Z0-9.,?! :;'";

  cribWordElem.className = '';
  document.getElementById('results').innerHTML = '';

  for (let i = 0; i < result.length; i++) {
    let li = document.createElement('li');
    li.className = 'result-item';
    let match = false;

    try {
      if (result[i].match(new RegExp(`^[${charSet}]+$`))) {
        match = true;
        li.classList.add('matching');
        cribWordElem.classList.add('text-success', 'border-success');
      }
    } catch (e) {
      cribWordElem.classList.add('text-danger', 'border-danger');
    }

    let textSpan = document.createElement('span');
    textSpan.textContent = result[i];
    if (match) {
      textSpan.classList.add('result-text');
    }
    li.appendChild(textSpan);

    let spacer = document.createElement('span');
    spacer.className = 'result-spacer';
    li.appendChild(spacer);

    let btn1 = document.createElement('button');
    btn1.textContent = 'output1';
    btn1.className = 'btn-accept';
    btn1.addEventListener('click', () => accept_crib(i, result[i], 1));

    let btn2 = document.createElement('button');
    btn2.textContent = 'output2';
    btn2.className = 'btn-accept';
    btn2.addEventListener('click', () => accept_crib(i, result[i], 2));

    li.appendChild(btn1);
    li.appendChild(btn2);

    document.getElementById('results').appendChild(li);
  }
}

// Accept crib and update outputs
export function accept_crib(index, value, result_index = 1) {
  let cribWord = document.getElementById('crib_word').value;
  let crib_len = cribWord.length;

  if (result_index === 1) {
    result_2 = result_2.substr(0, index) + cribWord + result_2.substr(index + crib_len);
    result_1 = result_1.substr(0, index) + value + result_1.substr(index + crib_len);
  } else {
    result_1 = result_1.substr(0, index) + cribWord + result_1.substr(index + crib_len);
    result_2 = result_2.substr(0, index) + value + result_2.substr(index + crib_len);
  }

  document.getElementById('output_1').value = result_1;
  document.getElementById('output_2').value = result_2;
}

// Event listeners for ciphertext inputs
export function processCiphertext1() {
  let type = document.getElementById('c1_type').value;
  let string = document.getElementById('ciphertext_1').value;

  switch (type) {
    case 'hex':
      ct1_hex_arr = Hex2HexArr(string);
      break;
    case 'ASCII':
      ct1_hex_arr = ASCII2HexArr(string);
      break;
    case 'bin':
      ct1_hex_arr = bin2HexArr(string);
      break;
  }

  document.getElementById('ciphertext_1_hex').value = ct1_hex_arr;
  init_result_1(ct1_hex_arr);
  ct1_xor_ct2_cal();
}

export function processCiphertext2() {
  let type = document.getElementById('c2_type').value;
  let string = document.getElementById('ciphertext_2').value;

  switch (type) {
    case 'hex':
      ct2_hex_arr = Hex2HexArr(string);
      break;
    case 'ASCII':
      ct2_hex_arr = ASCII2HexArr(string);
      break;
    case 'bin':
      ct2_hex_arr = bin2HexArr(string);
      break;
  }

  document.getElementById('ciphertext_2_hex').value = ct2_hex_arr;
  init_result_2(ct2_hex_arr);
  ct1_xor_ct2_cal();
}

// Initialize on page load
export function init() {
  // Attach event listeners
  document.getElementById('ciphertext_1').addEventListener('input', processCiphertext1);
  document.getElementById('ciphertext_2').addEventListener('input', processCiphertext2);
  document.getElementById('c1_type').addEventListener('change', processCiphertext1);
  document.getElementById('c2_type').addEventListener('change', processCiphertext2);
  document.getElementById('crib_word').addEventListener('input', crib_change);
  document.getElementById('char_set').addEventListener('input', () => crib_change());

  // Initialize on load
  processCiphertext1();
  processCiphertext2();
}

// Toggle tutorial section
export function toggleTutorial() {
  let tutorial = document.getElementById('tutorial');
  tutorial.style.display = tutorial.style.display === 'none' ? 'block' : 'none';
}
