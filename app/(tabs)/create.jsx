import { useState } from "react";
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { API_URL } from "../../constants/api";

export default function Create() {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [image, setImage] = useState(null); // to display the selected image
  const [imageBase64, setImageBase64] = useState(null); //to turn images into text
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  console.log(token);

  const pickImage = async () => {
    try {
      // request permission if needed
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Izin Ditolak",
            "Aplikasi membutuhkan izin galeri untuk mengunggah gambar"
          );
          return;
        }
      }

      // launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // lower quality for smaller base64
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);

        // if base64 is provided, use it
        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          // otherwise, convert to base64
          const base64 = await FileSystem.readAsStringAsync(
            result.assets[0].uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );

          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Kesalahan saat memilih gambar:", error);
      Alert.alert("Kesalahan", "Terjadi masalah saat memilih gambar");
    }
  };

  // Convert text to array (split by newlines)
  const parseIngredients = (text) => {
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const parseSteps = (text) => {
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleSubmit = async () => {
    if (!title || !ingredients || !steps || !imageBase64) {
      Alert.alert("Kesalahan", "Harap isi semua kolom terlebih dahulu");
      return;
    }

    const ingredientsArray = parseIngredients(ingredients);
    const stepsArray = parseSteps(steps);

    if (ingredientsArray.length === 0 || stepsArray.length === 0) {
      Alert.alert("Kesalahan", "Ingredients dan steps tidak boleh kosong");
      return;
    }

    try {
      setLoading(true);

      // get file extension from URI or default to jpeg
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];

      const imageType = fileType
        ? `image/${fileType.toLowerCase()}`
        : "image/jpeg";

      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

      // API call with new format
      const response = await fetch(`${API_URL}/recipe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          ingredients: ingredientsArray,
          steps: stepsArray,
          image: imageDataUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Berhasil", "Resep Anda telah diposting!");
      setTitle("");
      setIngredients("");
      setSteps("");
      setImage(null);
      setImageBase64(null);
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Ada yang salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        style={styles.scrollViewStyle}
      >
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Rekomendasi Resep</Text>
            <Text style={styles.subtitle}>
              Bagikan resep favoritmu dengan orang lain.
            </Text>
          </View>

          <View style={styles.form}>
            {/* RECIPE TITLE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Judul Resep</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="restaurant-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan judul resep"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* INGREDIENTS */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bahan-bahan</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Masukkan bahan-bahan (satu per baris)&#10;Contoh:&#10;2 cup beras&#10;3 butir telur&#10;1 sdt garam"
                placeholderTextColor={COLORS.placeholderText}
                value={ingredients}
                onChangeText={setIngredients}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* STEPS */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Langkah-langkah</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Masukkan langkah memasak (satu per baris)&#10;Contoh:&#10;Cuci beras hingga bersih&#10;Masak nasi dalam rice cooker&#10;Goreng telur hingga matang"
                placeholderTextColor={COLORS.placeholderText}
                value={steps}
                onChangeText={setSteps}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* IMAGE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Foto Masakan</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.placeholderText}>
                      Ketuk untuk memilih gambar
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Bagikan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
