package com.example.piccrypt.services;

import com.example.piccrypt.exceptions.GeneralException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

@Service
public class SteganographyService {
    private static final int KEY_START_BYTE = 13;
    private static final int MESSAGE_LENGTH_BYTES = 4;
    private static final int LSB_BITS = 3;
    private static final int LSB_MASK = 0x07;
    private static final int CLEAR_LSB_MASK = 0xF8;
    private static final int PASSWORD_HASH_BYTES = 4;
    private static final int AES_KEY_BYTES = 32;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final Path messageDir;
    private final String messageBaseUrl;

    public SteganographyService(@Value("${app.messages.dir}") String messageDir,
                                 @Value("${app.messages.base-url:/static/avatars/}") String messageBaseUrl) {
        this.messageDir = Paths.get(messageDir);
        this.messageBaseUrl = messageBaseUrl.endsWith("/") ? messageBaseUrl : messageBaseUrl + "/";
    }

    public File encrypt(File inputFile, String text, String password) throws Exception {
        byte[] byteImage = readBytes(inputFile);

        String uuid = UUID.randomUUID().toString();
        File parent = inputFile.getParentFile();
        File outputFile = new File(parent, uuid + ".gif");

        if (!checkFormat(byteImage)) {
            throw new Exception("Invalid GIF format. Expected GIF89a.");
        }

        byte[] encryptedMessage = encryptMessage(text, password);

        int maxCapacity = calculateMaxCapacity(byteImage);
        if (encryptedMessage.length > maxCapacity) {
            throw new Exception("Message is too large for this GIF file. Maximum capacity: " + maxCapacity + " characters.");
        }

        byte[] passwordHash = generatePasswordHash(password);

        insertPasswordHash(byteImage, passwordHash);

        int messageLength = encryptedMessage.length;
        int passwordHashBytesUsed = (PASSWORD_HASH_BYTES * 8 + LSB_BITS - 1) / LSB_BITS;
        int currentByte = KEY_START_BYTE + passwordHashBytesUsed;
        insertInteger(byteImage, messageLength, MESSAGE_LENGTH_BYTES, currentByte);

        int messageLengthBytesUsed = (MESSAGE_LENGTH_BYTES * 8 + LSB_BITS - 1) / LSB_BITS;
        currentByte += messageLengthBytesUsed;
        insertBytes(byteImage, encryptedMessage, currentByte);

        writeBytes(byteImage, outputFile);
        return outputFile;
    }

    public String decrypt(File inputFile, String password) throws Exception {
        byte[] byteImage = readBytes(inputFile);

        if (!checkFormat(byteImage)) {
            throw new Exception("Invalid GIF format. Expected GIF89a.");
        }

        byte[] storedHash = extractPasswordHash(byteImage);
        byte[] passwordHash = generatePasswordHash(password);
        boolean passwordMatches = Arrays.equals(storedHash, passwordHash);

        int passwordHashBytesUsed = (PASSWORD_HASH_BYTES * 8 + LSB_BITS - 1) / LSB_BITS;
        int currentByte = KEY_START_BYTE + passwordHashBytesUsed;
        int messageLength = extractInteger(byteImage, MESSAGE_LENGTH_BYTES, currentByte);

        int maxCapacity = calculateMaxCapacity(byteImage);
        if (messageLength <= 0 || messageLength > maxCapacity) {
            messageLength = Math.max(1, Math.min(maxCapacity, Math.abs(messageLength)));
        }

        int messageLengthBytesUsed = (MESSAGE_LENGTH_BYTES * 8 + LSB_BITS - 1) / LSB_BITS;
        currentByte += messageLengthBytesUsed;
        byte[] encryptedMessage = extractBytes(byteImage, messageLength, currentByte);

        String result = decryptMessage(encryptedMessage, password);
        if (!passwordMatches) {
            return result;
        }
        return result;
    }

    private int getPaletteEndPosition(byte[] bytes) {
        int packed = bytes[10] & 0xFF;

        boolean gctFlag = (packed & 0x80) != 0;
        int gctSize = packed & 0x07;

        if (!gctFlag) return KEY_START_BYTE;

        int colorCount = 1 << (gctSize + 1);
        return 13 + colorCount * 3;
    }
   
    public int getMaxTextLength(File inputFile) throws Exception {
        byte[] byteImage = readBytes(inputFile);

        if (!checkFormat(byteImage)) {
            throw new Exception("Invalid GIF format. Expected GIF89a.");
        }

        int maxCapacityBytes = calculateMaxCapacity(byteImage);

        int maxCharacters = maxCapacityBytes;

        return Math.max(0, maxCharacters);
    }

    private byte[] readBytes(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }

    private void writeBytes(byte[] byteImage, File file) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(byteImage);
        }
    }

    private boolean checkFormat(byte[] byteImage) {
        if (byteImage.length < 6) {
            return false;
        }

        return byteImage[0] == 'G' && byteImage[1] == 'I' && byteImage[2] == 'F' &&
                byteImage[3] == '8' && byteImage[4] == '9' && byteImage[5] == 'a';
    }

    public int getMaxCharacters(File inputFile) throws Exception {
        byte[] byteImage = readBytes(inputFile);

        if (!checkFormat(byteImage)) {
            throw new Exception("Invalid GIF format. Expected GIF89a.");
        }

        int maxBytes = calculateMaxCapacity(byteImage);

        return Math.max(0, maxBytes);
    }

    private int calculateMaxCapacity(byte[] byteImage) {
        int passwordHashBytesUsed = (PASSWORD_HASH_BYTES * 8 + LSB_BITS - 1) / LSB_BITS;
        int messageLengthBytesUsed = (MESSAGE_LENGTH_BYTES * 8 + LSB_BITS - 1) / LSB_BITS;
        int metadataBytes = passwordHashBytesUsed + messageLengthBytesUsed;

        int dataStart = KEY_START_BYTE + metadataBytes;

        if (dataStart >= byteImage.length) {
            return 0;
        }

        int safeEnd = findSafeEndPosition(byteImage);

        if (dataStart >= safeEnd) {
            return 0;
        }

        int availableImageBytes = safeEnd - dataStart;

        long totalBits = (long) availableImageBytes * LSB_BITS;
        int capacity = (int) (totalBits / 8);

        return Math.max(0, capacity);
    }

    private int findSafeEndPosition(byte[] bytes) {
        return getPaletteEndPosition(bytes);
    }

    private int findSizePalette(byte[] byteImage) {
        if (byteImage.length <= 10) {
            return 0;
        }
        int intByte = byteImage[10] & 0xFF;
        int paletteSize = intByte & 0x07;
        return paletteSize;
    }

    private byte[] generatePasswordHash(String password) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
        return Arrays.copyOf(hash, PASSWORD_HASH_BYTES);
    }

    private byte[] encryptMessage(String message, String password) throws Exception {
        byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes = deriveAesKey(password);

        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);

        byte[] cipherText = cipher.doFinal(messageBytes);

        byte[] result = new byte[iv.length + cipherText.length];
        System.arraycopy(iv, 0, result, 0, iv.length);
        System.arraycopy(cipherText, 0, result, iv.length, cipherText.length);

        return result;
    }

    private String decryptMessage(byte[] encryptedMessage, String password) throws Exception {
        byte[] keyBytes = deriveAesKey(password);

        if (encryptedMessage.length < GCM_IV_LENGTH) {
            byte[] ivFallback = new byte[GCM_IV_LENGTH];
            System.arraycopy(encryptedMessage, 0, ivFallback, 0, Math.min(encryptedMessage.length, ivFallback.length));
            return bestEffortDecryptNoAuth(encryptedMessage, ivFallback, keyBytes);
        }

        byte[] iv = Arrays.copyOfRange(encryptedMessage, 0, GCM_IV_LENGTH);
        byte[] cipherText = Arrays.copyOfRange(encryptedMessage, GCM_IV_LENGTH, encryptedMessage.length);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);

            byte[] decrypted = cipher.doFinal(cipherText);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return bestEffortDecryptNoAuth(cipherText, iv, keyBytes);
        }
    }

    private String bestEffortDecryptNoAuth(byte[] cipherText, byte[] iv, byte[] keyBytes) {
        try {
            Cipher cipher = Cipher.getInstance("AES/CTR/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            byte[] iv16 = new byte[16];
            System.arraycopy(iv, 0, iv16, 0, Math.min(iv.length, iv16.length));
            IvParameterSpec ivSpec = new IvParameterSpec(iv16);

            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decrypted = cipher.doFinal(cipherText);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "Invalid password or corrupted data";
        }
    }

    private byte[] deriveAesKey(String password) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
        return Arrays.copyOf(hash, AES_KEY_BYTES);
    }

    private void insertPasswordHash(byte[] byteImage, byte[] passwordHash) {
        int safeEnd = findSafeEndPosition(byteImage);
        int currentByte = KEY_START_BYTE;
        int bitBuffer = 0;
        int bitsInBuffer = 0;

        for (byte hashByte : passwordHash) {
            bitBuffer = (bitBuffer << 8) | (hashByte & 0xFF);
            bitsInBuffer += 8;

            while (bitsInBuffer >= LSB_BITS) {
                if (currentByte >= safeEnd || currentByte >= byteImage.length) {
                    return;
                }

                int bitsToStore = (bitBuffer >> (bitsInBuffer - LSB_BITS)) & LSB_MASK;

                byteImage[currentByte] = (byte) ((byteImage[currentByte] & CLEAR_LSB_MASK) | bitsToStore);

                bitsInBuffer -= LSB_BITS;
                currentByte++;
            }
        }

        if (bitsInBuffer > 0 && currentByte < safeEnd && currentByte < byteImage.length) {
            int bitsToStore = (bitBuffer << (LSB_BITS - bitsInBuffer)) & LSB_MASK;
            byteImage[currentByte] = (byte) ((byteImage[currentByte] & CLEAR_LSB_MASK) | bitsToStore);
        }
    }

    private byte[] extractPasswordHash(byte[] byteImage) {
        byte[] hash = new byte[PASSWORD_HASH_BYTES];
        int currentByte = KEY_START_BYTE;
        int bitBuffer = 0;
        int bitsInBuffer = 0;
        int hashIndex = 0;

        int totalBitsNeeded = PASSWORD_HASH_BYTES * 8;

        while (hashIndex < PASSWORD_HASH_BYTES && currentByte < byteImage.length) {
            int bits = byteImage[currentByte] & LSB_MASK;
            bitBuffer = (bitBuffer << LSB_BITS) | bits;
            bitsInBuffer += LSB_BITS;
            currentByte++;

            while (bitsInBuffer >= 8 && hashIndex < PASSWORD_HASH_BYTES) {
                hash[hashIndex] = (byte) ((bitBuffer >> (bitsInBuffer - 8)) & 0xFF);
                bitsInBuffer -= 8;
                hashIndex++;
            }
        }

        return hash;
    }

    private void insertInteger(byte[] byteImage, int value, int numBytes, int startByte) {
        int safeEnd = findSafeEndPosition(byteImage);
        int currentByte = startByte;
        int bitBuffer = 0;
        int bitsInBuffer = 0;

        for (int byteIndex = numBytes - 1; byteIndex >= 0; byteIndex--) {
            byte byteValue = (byte) ((value >> (byteIndex * 8)) & 0xFF);
            bitBuffer = (bitBuffer << 8) | (byteValue & 0xFF);
            bitsInBuffer += 8;

            while (bitsInBuffer >= LSB_BITS) {
                if (currentByte >= safeEnd || currentByte >= byteImage.length) {
                    return;
                }

                int bitsToStore = (bitBuffer >> (bitsInBuffer - LSB_BITS)) & LSB_MASK;
                byteImage[currentByte] = (byte) ((byteImage[currentByte] & CLEAR_LSB_MASK) | bitsToStore);

                bitsInBuffer -= LSB_BITS;
                currentByte++;
            }
        }

        if (bitsInBuffer > 0 && currentByte < safeEnd && currentByte < byteImage.length) {
            int bitsToStore = (bitBuffer << (LSB_BITS - bitsInBuffer)) & LSB_MASK;
            byteImage[currentByte] = (byte) ((byteImage[currentByte] & CLEAR_LSB_MASK) | bitsToStore);
        }
    }

    private int extractInteger(byte[] byteImage, int numBytes, int startByte) {
        int value = 0;
        int currentByte = startByte;
        int bitBuffer = 0;
        int bitsInBuffer = 0;
        int bytesExtracted = 0;

        int totalBitsNeeded = numBytes * 8;

        while (bytesExtracted < numBytes && currentByte < byteImage.length) {
            int bits = byteImage[currentByte] & LSB_MASK;
            bitBuffer = (bitBuffer << LSB_BITS) | bits;
            bitsInBuffer += LSB_BITS;
            currentByte++;

            while (bitsInBuffer >= 8 && bytesExtracted < numBytes) {
                byte byteValue = (byte) ((bitBuffer >> (bitsInBuffer - 8)) & 0xFF);
                value = (value << 8) | (byteValue & 0xFF);
                bitsInBuffer -= 8;
                bytesExtracted++;
            }
        }

        return value;
    }

    private void insertBytes(byte[] byteImage, byte[] data, int startByte) {
        int safeEnd = findSafeEndPosition(byteImage);
        int currentByte = startByte;
        int bitBuffer = 0;
        int bitsInBuffer = 0;

        for (byte dataByte : data) {
            bitBuffer = (bitBuffer << 8) | (dataByte & 0xFF);
            bitsInBuffer += 8;

            while (bitsInBuffer >= LSB_BITS) {
                if (currentByte >= safeEnd || currentByte >= byteImage.length) {
                    return;
                }

                int bitsToStore = (bitBuffer >> (bitsInBuffer - LSB_BITS)) & LSB_MASK;
                byteImage[currentByte] = (byte) ((byteImage[currentByte] & CLEAR_LSB_MASK) | bitsToStore);

                bitsInBuffer -= LSB_BITS;
                currentByte++;
            }
        }

        if (bitsInBuffer > 0 && currentByte < safeEnd && currentByte < byteImage.length) {
            int bitsToStore = (bitBuffer << (LSB_BITS - bitsInBuffer)) & LSB_MASK;
            byteImage[currentByte] = (byte) ((byteImage[currentByte] & CLEAR_LSB_MASK) | bitsToStore);
        }
    }

    private byte[] extractBytes(byte[] byteImage, int length, int startByte) {
        byte[] data = new byte[length];
        int currentByte = startByte;
        int bitBuffer = 0;
        int bitsInBuffer = 0;
        int dataIndex = 0;

        while (dataIndex < length && currentByte < byteImage.length) {
            int bits = byteImage[currentByte] & LSB_MASK;
            bitBuffer = (bitBuffer << LSB_BITS) | bits;
            bitsInBuffer += LSB_BITS;
            currentByte++;

            while (bitsInBuffer >= 8 && dataIndex < length) {
                data[dataIndex] = (byte) ((bitBuffer >> (bitsInBuffer - 8)) & 0xFF);
                bitsInBuffer -= 8;
                dataIndex++;
            }
        }

        return data;
    }

    public String encryptAndStore(MultipartFile file, String text, String password) throws Exception {
        File inputFile = convertToFile(file);
        File encryptedFile = encrypt(inputFile, text, password);
        
        try {
            String filename = UUID.randomUUID() + ".gif";
            Path target = messageDir.resolve(filename);
            
            Files.createDirectories(messageDir);
            Files.copy(encryptedFile.toPath(), target);

            Files.deleteIfExists(inputFile.toPath());
            Files.deleteIfExists(encryptedFile.toPath());
            
            return messageBaseUrl + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store encrypted GIF", e);
        }
    }

    public String storeWithoutEncryption(MultipartFile file) {
        try {
            File inputFile = convertToFile(file);
            String originalName = Optional.ofNullable(file.getOriginalFilename()).orElse("image.gif");
            String ext = "";
            int dot = originalName.lastIndexOf('.');
            if (dot != -1 && dot < originalName.length() - 1) {
                ext = originalName.substring(dot).toLowerCase();
            }
            if (!(ext.equals(".gif") || ext.equals(".png") || ext.equals(".jpg") || ext.equals(".jpeg"))) {
                ext = ".gif";
            }

            String filename = UUID.randomUUID() + ext;
            Path target = messageDir.resolve(filename);

            Files.createDirectories(messageDir);
            Files.copy(inputFile.toPath(), target);

            Files.deleteIfExists(inputFile.toPath());

            return messageBaseUrl + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image", e);
        }
    }

    // public String decryptFromUrl(String imageUrl, String password) throws Exception {
    //     String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
    //     Path imagePath = messageDir.resolve(filename);
        
    //     if (!Files.exists(imagePath)) {
    //         throw new Exception("Image not found at URL: " + imageUrl);
    //     }
        
    //     File imageFile = imagePath.toFile();
    //     return decrypt(imageFile, password);
    // }

     private File convertToFile(MultipartFile multipartFile) throws IOException {
         File conv = File.createTempFile("upload_", multipartFile.getOriginalFilename());
         multipartFile.transferTo(conv);
         return conv;
     }

}


/*
package com.example.piccrypt.services;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

@Service
public class SteganographyService {
    private static final int KEY_START_BYTE = 13;
    private static final int MESSAGE_LENGTH_BYTES = 4;
    private static final int LSB_BITS = 3;
    private static final int LSB_MASK = 0x07;
    private static final int CLEAR_LSB_MASK = 0xF8;
    private static final int PASSWORD_HASH_BYTES = 4;
    private static final int AES_KEY_BYTES = 32;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    public File encrypt(File inputFile, String text, String password) throws Exception {
        byte[] byteImage = readBytes(inputFile);

        String uuid = UUID.randomUUID().toString();
        File parent = inputFile.getParentFile();
        File outputFile = new File(parent, uuid + ".gif");

        if (!checkFormat(byteImage)) {
            throw new Exception("Invalid GIF format. Expected GIF89a.");
        }

        // 1. Generate the deterministic shuffle map based on password
        int[] shuffledIndices = getShuffledIndices(byteImage, password);
        int pointer = 0; // Tracks our position in the shuffled list

        byte[] encryptedMessage = encryptMessage(text, password);
        int maxCapacity = calculateMaxCapacity(byteImage);

        if (encryptedMessage.length > maxCapacity) {
            throw new Exception("Message is too large for this GIF. Max bytes: " + maxCapacity);
        }

        byte[] passwordHash = generatePasswordHash(password);

        // 2. Insert Password Hash (Randomly placed based on seed)
        pointer = insertPasswordHash(byteImage, passwordHash, shuffledIndices, pointer);

        // 3. Insert Message Length (Randomly placed)
        pointer = insertInteger(byteImage, encryptedMessage.length, MESSAGE_LENGTH_BYTES, shuffledIndices, pointer);

        // 4. Insert Encrypted Message (Randomly placed)
        insertBytes(byteImage, encryptedMessage, shuffledIndices, pointer);

        writeBytes(byteImage, outputFile);
        return outputFile;
    }

    public String decrypt(File inputFile, String password) throws Exception {
        byte[] byteImage = readBytes(inputFile);

        if (!checkFormat(byteImage)) {
            throw new Exception("Invalid GIF format. Expected GIF89a.");
        }

        // 1. Regenerate the exact same shuffle map using the password
        int[] shuffledIndices = getShuffledIndices(byteImage, password);
        int pointer = 0;

        // 2. Extract and verify Hash
        byte[] storedHash = extractPasswordHash(byteImage, shuffledIndices, pointer);
        pointer += calculateBytesUsed(PASSWORD_HASH_BYTES); // Advance pointer logically

        byte[] computedHash = generatePasswordHash(password);

        // If hash doesn't match, the shuffle order was wrong anyway (garbage data),
        // but we explicitly check here.
        boolean passwordMatches = Arrays.equals(storedHash, computedHash);

        // 3. Extract Length
        int messageLength = extractInteger(byteImage, MESSAGE_LENGTH_BYTES, shuffledIndices, pointer);
        pointer += calculateBytesUsed(MESSAGE_LENGTH_BYTES);

        // Safety check on length
        int maxCapacity = calculateMaxCapacity(byteImage);
        if (messageLength <= 0 || messageLength > maxCapacity) {
            // If length is garbage (due to wrong password/shuffle), clamp it to avoid crashes
            messageLength = Math.max(1, Math.min(maxCapacity, Math.abs(messageLength)));
        }

        // 4. Extract Message
        byte[] encryptedMessage = extractBytes(byteImage, messageLength, shuffledIndices, pointer);

        String result = decryptMessage(encryptedMessage, password);

        // Even if decryption "succeeds" (rare with wrong key), we warn if hash didn't match.
        // In this shuffled scheme, a wrong password usually results in total garbage
        // before we even reach this line.
        if (!passwordMatches) {
            // Depending on your requirements, you might throw an exception here
            // throw new Exception("Invalid Password");
            return result;
        }
        return result;
    }

    // --- FISHER-YATES SHUFFLE LOGIC ---
private int[] getShuffledIndices(byte[] byteImage, String password) throws Exception {
    int start = KEY_START_BYTE;
    int end = findSafeEndPosition(byteImage);

    if (end <= start) {
        return new int[0];
    }

    int capacity = end - start;

    // Create list of all available byte positions: [13, 14, 15, ..., end]
    List<Integer> indices = new ArrayList<>(capacity);
    for (int i = 0; i < capacity; i++) {
        indices.add(start + i);
    }

    // Generate a deterministic seed from the password
    long seed = generatePasswordHashLong(password);

    // Shuffle using standard Random (not SecureRandom) to ensure determinism across runs
    Collections.shuffle(indices, new Random(seed));

    // Convert to primitive array
    return indices.stream().mapToInt(i -> i).toArray();
}

private long generatePasswordHashLong(String password) throws Exception {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
    long result = 0;
    // Take first 8 bytes of hash to build a long seed
    for (int i = 0; i < 8; i++) {
        result = (result << 8) | (hash[i] & 0xFF);
    }
    return result;
}

private int calculateBytesUsed(int dataLength) {
    return (dataLength * 8 + LSB_BITS - 1) / LSB_BITS;
}

// --- READ / WRITE HELPERS (UPDATED FOR SHUFFLE) ---

private int insertPasswordHash(byte[] byteImage, byte[] passwordHash, int[] shuffledIndices, int pointer) {
    return insertBytes(byteImage, passwordHash, shuffledIndices, pointer);
}

private byte[] extractPasswordHash(byte[] byteImage, int[] shuffledIndices, int pointer) {
    return extractBytes(byteImage, PASSWORD_HASH_BYTES, shuffledIndices, pointer);
}

private int insertInteger(byte[] byteImage, int value, int numBytes, int[] shuffledIndices, int pointer) {
    int bitBuffer = 0;
    int bitsInBuffer = 0;

    for (int byteIndex = numBytes - 1; byteIndex >= 0; byteIndex--) {
        byte byteValue = (byte) ((value >> (byteIndex * 8)) & 0xFF);
        bitBuffer = (bitBuffer << 8) | (byteValue & 0xFF);
        bitsInBuffer += 8;

        while (bitsInBuffer >= LSB_BITS) {
            if (pointer >= shuffledIndices.length) return pointer;

            int targetByteIndex = shuffledIndices[pointer];

            int bitsToStore = (bitBuffer >> (bitsInBuffer - LSB_BITS)) & LSB_MASK;
            byteImage[targetByteIndex] = (byte) ((byteImage[targetByteIndex] & CLEAR_LSB_MASK) | bitsToStore);

            bitsInBuffer -= LSB_BITS;
            pointer++;
        }
    }

    // Handle remaining bits (if any)
    if (bitsInBuffer > 0 && pointer < shuffledIndices.length) {
        int targetByteIndex = shuffledIndices[pointer];
        int bitsToStore = (bitBuffer << (LSB_BITS - bitsInBuffer)) & LSB_MASK;
        byteImage[targetByteIndex] = (byte) ((byteImage[targetByteIndex] & CLEAR_LSB_MASK) | bitsToStore);
        // Note: We don't increment pointer here usually because we didn't fill the byte,
        // but strictly we should probably burn the byte to keep sync easy.
        // For simplicity in LSB streaming, we often assume strict alignment or waste the partial.
        // Given the previous code logic, let's burn the byte index to stay safe.
        pointer++;
    }
    return pointer;
}

private int extractInteger(byte[] byteImage, int numBytes, int[] shuffledIndices, int pointer) {
    int value = 0;
    int bitBuffer = 0;
    int bitsInBuffer = 0;
    int bytesExtracted = 0;

    while (bytesExtracted < numBytes && pointer < shuffledIndices.length) {
        int targetByteIndex = shuffledIndices[pointer];
        int bits = byteImage[targetByteIndex] & LSB_MASK;

        bitBuffer = (bitBuffer << LSB_BITS) | bits;
        bitsInBuffer += LSB_BITS;
        pointer++;

        while (bitsInBuffer >= 8 && bytesExtracted < numBytes) {
            byte byteValue = (byte) ((bitBuffer >> (bitsInBuffer - 8)) & 0xFF);
            value = (value << 8) | (byteValue & 0xFF);
            bitsInBuffer -= 8;
            bytesExtracted++;
        }
    }
    return value;
}

private int insertBytes(byte[] byteImage, byte[] data, int[] shuffledIndices, int pointer) {
    int bitBuffer = 0;
    int bitsInBuffer = 0;

    for (byte dataByte : data) {
        bitBuffer = (bitBuffer << 8) | (dataByte & 0xFF);
        bitsInBuffer += 8;

        while (bitsInBuffer >= LSB_BITS) {
            if (pointer >= shuffledIndices.length) return pointer;

            int targetByteIndex = shuffledIndices[pointer];
            int bitsToStore = (bitBuffer >> (bitsInBuffer - LSB_BITS)) & LSB_MASK;

            byteImage[targetByteIndex] = (byte) ((byteImage[targetByteIndex] & CLEAR_LSB_MASK) | bitsToStore);

            bitsInBuffer -= LSB_BITS;
            pointer++;
        }
    }

    if (bitsInBuffer > 0 && pointer < shuffledIndices.length) {
        int targetByteIndex = shuffledIndices[pointer];
        int bitsToStore = (bitBuffer << (LSB_BITS - bitsInBuffer)) & LSB_MASK;
        byteImage[targetByteIndex] = (byte) ((byteImage[targetByteIndex] & CLEAR_LSB_MASK) | bitsToStore);
        pointer++;
    }
    return pointer;
}

private byte[] extractBytes(byte[] byteImage, int length, int[] shuffledIndices, int pointer) {
    byte[] data = new byte[length];
    int bitBuffer = 0;
    int bitsInBuffer = 0;
    int dataIndex = 0;

    while (dataIndex < length && pointer < shuffledIndices.length) {
        int targetByteIndex = shuffledIndices[pointer];
        int bits = byteImage[targetByteIndex] & LSB_MASK;

        bitBuffer = (bitBuffer << LSB_BITS) | bits;
        bitsInBuffer += LSB_BITS;
        pointer++;

        while (bitsInBuffer >= 8 && dataIndex < length) {
            data[dataIndex] = (byte) ((bitBuffer >> (bitsInBuffer - 8)) & 0xFF);
            bitsInBuffer -= 8;
            dataIndex++;
        }
    }
    return data;
}

// --- STANDARD CRYPTO & GIF HELPERS (UNCHANGED) ---

public int getMaxCharacters(File inputFile) throws Exception {
    byte[] byteImage = readBytes(inputFile);
    if (!checkFormat(byteImage)) throw new Exception("Invalid GIF format.");
    return Math.max(0, calculateMaxCapacity(byteImage));
}

private int calculateMaxCapacity(byte[] byteImage) {
    // Calculate max based on palette size minus metadata
    int safeEnd = findSafeEndPosition(byteImage);
    int availableBytes = safeEnd - KEY_START_BYTE;
    if (availableBytes <= 0) return 0;

    long totalBits = (long) availableBytes * LSB_BITS;
    int totalCapacity = (int) (totalBits / 8);

    // Subtract metadata overhead
    int overhead = PASSWORD_HASH_BYTES + MESSAGE_LENGTH_BYTES;
    // Subtract crypto overhead (IV + GCM Tag)
    int cryptoOverhead = GCM_IV_LENGTH + (GCM_TAG_LENGTH / 8);

    return Math.max(0, totalCapacity - overhead - cryptoOverhead);
}

private int findSafeEndPosition(byte[] bytes) {
    return getPaletteEndPosition(bytes);
}

private int getPaletteEndPosition(byte[] bytes) {
    int packed = bytes[10] & 0xFF;
    boolean gctFlag = (packed & 0x80) != 0;
    int gctSize = packed & 0x07;

    if (!gctFlag) return KEY_START_BYTE;

    int colorCount = 1 << (gctSize + 1);
    return 13 + colorCount * 3;
}

private byte[] readBytes(File file) throws IOException {
    try (FileInputStream fis = new FileInputStream(file);
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = fis.read(buffer)) != -1) {
            baos.write(buffer, 0, bytesRead);
        }
        return baos.toByteArray();
    }
}

private void writeBytes(byte[] byteImage, File file) throws IOException {
    try (FileOutputStream fos = new FileOutputStream(file)) {
        fos.write(byteImage);
    }
}

private boolean checkFormat(byte[] byteImage) {
    if (byteImage.length < 6) return false;
    return byteImage[0] == 'G' && byteImage[1] == 'I' && byteImage[2] == 'F' &&
            byteImage[3] == '8' && byteImage[4] == '9' && byteImage[5] == 'a';
}

private byte[] generatePasswordHash(String password) throws Exception {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
    return Arrays.copyOf(hash, PASSWORD_HASH_BYTES);
}

private byte[] deriveAesKey(String password) throws Exception {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
    return Arrays.copyOf(hash, AES_KEY_BYTES);
}

private byte[] encryptMessage(String message, String password) throws Exception {
    byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
    byte[] keyBytes = deriveAesKey(password);

    byte[] iv = new byte[GCM_IV_LENGTH];
    new SecureRandom().nextBytes(iv);

    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
    GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
    cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);

    byte[] cipherText = cipher.doFinal(messageBytes);

    byte[] result = new byte[iv.length + cipherText.length];
    System.arraycopy(iv, 0, result, 0, iv.length);
    System.arraycopy(cipherText, 0, result, iv.length, cipherText.length);

    return result;
}

private String decryptMessage(byte[] encryptedMessage, String password) throws Exception {
    byte[] keyBytes = deriveAesKey(password);

    if (encryptedMessage.length < GCM_IV_LENGTH) {
        return ""; // Or throw exception
    }

    byte[] iv = Arrays.copyOfRange(encryptedMessage, 0, GCM_IV_LENGTH);
    byte[] cipherText = Arrays.copyOfRange(encryptedMessage, GCM_IV_LENGTH, encryptedMessage.length);

    try {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);

        byte[] decrypted = cipher.doFinal(cipherText);
        return new String(decrypted, StandardCharsets.UTF_8);
    } catch (Exception ex) {
        // Decryption failed (integrity check failed)
        return "Invalid password or corrupted data";
    }
}
}


 */