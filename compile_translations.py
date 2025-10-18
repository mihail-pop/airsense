#!/usr/bin/env python3
import struct
import os

def compile_po_to_mo(po_file, mo_file):
    """Simple PO to MO compiler"""
    translations = {}
    
    with open(po_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse PO file
    lines = content.split('\n')
    msgid = None
    msgstr = None
    
    for line in lines:
        line = line.strip()
        if line.startswith('msgid "') and line.endswith('"'):
            msgid = line[7:-1]  # Remove msgid " and "
        elif line.startswith('msgstr "') and line.endswith('"'):
            msgstr = line[8:-1]  # Remove msgstr " and "
            if msgid and msgstr:
                translations[msgid] = msgstr
            msgid = None
            msgstr = None
    
    # Create MO file
    keys = sorted(translations.keys())
    koffsets = []
    voffsets = []
    kencoded = []
    vencoded = []
    
    for k in keys:
        kencoded.append(k.encode('utf-8'))
        vencoded.append(translations[k].encode('utf-8'))
    
    keystart = 7 * 4 + 16 * len(keys)
    valuestart = keystart
    for k in kencoded:
        valuestart += len(k)
    
    koffsets = []
    voffsets = []
    
    for i, (k, v) in enumerate(zip(kencoded, vencoded)):
        koffsets.append((len(k), keystart))
        keystart += len(k)
        voffsets.append((len(v), valuestart))
        valuestart += len(v)
    
    # Generate the output
    output = struct.pack('<I', 0x950412de)  # Magic number
    output += struct.pack('<I', 0)          # Version
    output += struct.pack('<I', len(keys))  # Number of entries
    output += struct.pack('<I', 7 * 4)      # Offset of key table
    output += struct.pack('<I', 7 * 4 + 8 * len(keys))  # Offset of value table
    output += struct.pack('<I', 0)          # Hash table size
    output += struct.pack('<I', 0)          # Hash table offset
    
    for length, offset in koffsets:
        output += struct.pack('<I', length)
        output += struct.pack('<I', offset)
    
    for length, offset in voffsets:
        output += struct.pack('<I', length)
        output += struct.pack('<I', offset)
    
    for k in kencoded:
        output += k
    
    for v in vencoded:
        output += v
    
    with open(mo_file, 'wb') as f:
        f.write(output)

if __name__ == '__main__':
    po_file = 'locale/ro/LC_MESSAGES/django.po'
    mo_file = 'locale/ro/LC_MESSAGES/django.mo'
    
    if os.path.exists(po_file):
        compile_po_to_mo(po_file, mo_file)
        print(f"Compiled {po_file} to {mo_file}")
    else:
        print(f"PO file {po_file} not found")