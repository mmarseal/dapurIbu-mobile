import { useEffect, useState } from "react";
import {
  View,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import LogoutButton from "../../components/LogoutButton";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { Image } from "expo-image";
import { sleep } from ".";
import Loader from "../../components/Loader";

export default function Profile() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteRecipeId, setDeleteRecipeId] = useState(null);

  const { token } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/recipe/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch user recipes");

      setRecipes(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Gagal memuat data profil. Tarik ke bawah untuk segarkan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRecipe = async (recipeId) => {
    try {
      setDeleteRecipeId(recipeId);

      const response = await fetch(`${API_URL}/recipe/${recipeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Gagal menghapus resep");

      setRecipes(recipes.filter((recipe) => recipe._id !== recipeId));
      Alert.alert("Berhasil", "Berhasil menghapus resep");
    } catch (error) {
      Alert.alert("Error", error.message || "Gagal menghapus resep");
    } finally {
      setDeleteRecipeId(null);
    }
  };

  const confirmDelete = (recipeId) => {
    Alert.alert(
      "Hapus Resep",
      "Apakah kamu yakin ingin menghapus rekomendasi resep ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => handleDeleteRecipe(recipeId),
        },
      ]
    );
  };

  // Format date helper
  // const formatDate = (dateString) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("id-ID", {
  //     day: "numeric",
  //     month: "short",
  //     year: "numeric",
  //   });
  // };

  const renderRecipeItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image source={{ uri: item.image }} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>

        {/* Ingredients Preview */}
        {item.ingredients && item.ingredients.length > 0 && (
          <Text style={styles.bookCaption} numberOfLines={2}>
            <Text style={{ fontWeight: "bold" }}>Bahan: </Text>
            {item.ingredients.slice(0, 2).join(", ")}
            {item.ingredients.length > 2 ? " ..." : ""}
          </Text>
        )}

        {/* Steps Preview */}
        {item.steps && item.steps.length > 0 && (
          <Text style={styles.bookCaption} numberOfLines={2}>
            <Text style={{ fontWeight: "bold" }}>Langkah: </Text>
            {item.steps[0].length > 50
              ? `${item.steps[0].substring(0, 50)}...`
              : item.steps[0]}
          </Text>
        )}

        {/* <Text style={styles.bookDate}>{formatDate(item.createdAt)}</Text> */}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item._id)}
        disabled={deleteRecipeId === item._id}
      >
        {deleteRecipeId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) return <Loader />;

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />

      {/* YOUR RECOMMENDATIONS */}
      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Rekomendasi Resep Masakanmu</Text>
        <Text style={styles.booksCount}>{recipes.length} resep</Text>
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="restaurant-outline"
              size={50}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>
              Tidak ada rekomendasi resep masakan
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/create")}
            >
              <Text style={styles.addButtonText}>
                Tambahkan rekomendasi resep pertamamu
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
