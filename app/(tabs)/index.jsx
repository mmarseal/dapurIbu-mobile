import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../store/authStore";

import { Image } from "expo-image";
import { useEffect, useState } from "react";

import styles from "../../assets/styles/home.styles";
import { API_URL } from "../../constants/api";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const { token } = useAuthStore();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchRecipes = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await fetch(
        `${API_URL}/recipe?page=${pageNum}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch recipes");

      // Fix: Use proper deduplication logic
      if (refresh || pageNum === 1) {
        setRecipes(data.Recipes);
      } else {
        // Append new recipes, avoiding duplicates
        setRecipes((prevRecipes) => {
          const existingIds = new Set(prevRecipes.map((r) => r._id));
          const newRecipes = data.Recipes.filter(
            (r) => !existingIds.has(r._id)
          );
          return [...prevRecipes, ...newRecipes];
        });
      }

      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log("Error fetching recipes", error);
    } finally {
      if (refresh) {
        await sleep(800);
        setRefreshing(false);
      } else setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleLoadMore = async () => {
    if (hasMore && !loading && !refreshing) {
      await fetchRecipes(page + 1);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookCard}>
      {/* USER INFO */}
      <View style={styles.bookHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.user.profileImage }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.user.username}</Text>
          </View>
        </View>
      </View>

      {/* RECIPE IMAGE */}
      <View style={styles.bookImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.bookImage}
          contentFit="cover"
        />
      </View>

      {/* RECIPE DETAILS */}
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle}>{item.title}</Text>

        {/* INGREDIENTS FULL LIST */}
        {item.ingredients && item.ingredients.length > 0 && (
          <View
            style={[styles.sectionPreview, { marginTop: 15, marginBottom: 15 }]}
          >
            <Text style={[styles.sectionTitle, { fontWeight: "bold" }]}>
              Bahan-bahan:
            </Text>
            {item.ingredients.map((ingredient, index) => (
              <Text
                key={index}
                style={[styles.ingredientItem, { marginTop: 5 }]}
              >
                • {ingredient}
              </Text>
            ))}
          </View>
        )}

        {/* STEPS FULL LIST */}
        {item.steps && item.steps.length > 0 && (
          <View
            style={[styles.sectionPreview, { marginTop: 15, marginBottom: 15 }]}
          >
            <Text style={[styles.sectionTitle, { fontWeight: "bold" }]}>
              Cara membuat:
            </Text>
            {item.steps.map((step, index) => (
              <Text key={index} style={[styles.stepItem, { marginTop: 5 }]}>
                {index + 1}. {step}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRecipes(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dapur Ibu 🍲</Text>
            <Text style={styles.headerSubtitle}>Inspirasi masakan rumahan</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && recipes.length > 0 ? (
            <ActivityIndicator
              style={styles.footerLoader}
              size="small"
              color={COLORS.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="restaurant-outline"
              size={60}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>Belum ada resep masakan</Text>
            <Text style={styles.emptySubtext}>
              Jadilah yang pertama untuk membagikan resep masakan!{" "}
            </Text>
          </View>
        }
      />
    </View>
  );
}
