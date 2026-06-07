import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const STORAGE_PRODUCTS = "@tech_eletronicos_produtos";
const STORAGE_SALES = "@tech_eletronicos_vendas";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const savedProducts = await AsyncStorage.getItem(STORAGE_PRODUCTS);
      const savedSales = await AsyncStorage.getItem(STORAGE_SALES);

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedSales) setSales(JSON.parse(savedSales));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    }
  }

  async function saveProducts(newProducts) {
    setProducts(newProducts);
    await AsyncStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(newProducts));
  }

  async function saveSales(newSales) {
    setSales(newSales);
    await AsyncStorage.setItem(STORAGE_SALES, JSON.stringify(newSales));
  }

  function clearProductForm() {
    setName("");
    setCategory("");
    setPrice("");
    setQuantity("");
  }

  async function addProduct() {
    if (!name || !category || !price || !quantity) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    const parsedPrice = Number(price.replace(",", "."));
    const parsedQuantity = Number(quantity);

    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      Alert.alert("Atenção", "Informe preço e quantidade válidos.");
      return;
    }

    const newProduct = {
      id: Date.now().toString(),
      name,
      category,
      price: parsedPrice,
      quantity: parsedQuantity,
      createdAt: new Date().toLocaleDateString("pt-BR")
    };

    const updatedProducts = [...products, newProduct];
    await saveProducts(updatedProducts);
    clearProductForm();

    Alert.alert("Sucesso", "Produto cadastrado com sucesso!");
    setScreen("stock");
  }

  async function deleteProduct(productId) {
    Alert.alert("Confirmar", "Deseja excluir este produto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const updatedProducts = products.filter((item) => item.id !== productId);
          await saveProducts(updatedProducts);
        }
      }
    ]);
  }

  async function registerSale() {
    if (!selectedProductId || !saleQuantity) {
      Alert.alert("Atenção", "Selecione um produto e informe a quantidade.");
      return;
    }

    const qty = Number(saleQuantity);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Atenção", "Informe uma quantidade válida.");
      return;
    }

    const product = products.find((item) => item.id === selectedProductId);

    if (!product) {
      Alert.alert("Erro", "Produto não encontrado.");
      return;
    }

    if (product.quantity < qty) {
      Alert.alert("Estoque insuficiente", `Disponível: ${product.quantity} unidade(s).`);
      return;
    }

    const updatedProducts = products.map((item) => {
      if (item.id === selectedProductId) {
        return { ...item, quantity: item.quantity - qty };
      }
      return item;
    });

    const newSale = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      total: product.price * qty,
      date: new Date().toLocaleDateString("pt-BR")
    };

    await saveProducts(updatedProducts);
    await saveSales([newSale, ...sales]);

    setSelectedProductId("");
    setSaleQuantity("");
    Alert.alert("Sucesso", "Venda registrada com sucesso!");
    setScreen("sales");
  }

  async function clearAllData() {
    Alert.alert("Confirmar", "Deseja apagar todos os dados do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_PRODUCTS);
          await AsyncStorage.removeItem(STORAGE_SALES);
          setProducts([]);
          setSales([]);
        }
      }
    ]);
  }

  const totalItems = products.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = sales.reduce((sum, item) => sum + item.total, 0);

  function formatMoney(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tech Eletrônicos</Text>
        <Text style={styles.headerSubtitle}>Controle de estoque e vendas</Text>
      </View>

      <View style={styles.menu}>
        <MenuButton title="Início" active={screen === "home"} onPress={() => setScreen("home")} />
        <MenuButton title="Produto" active={screen === "product"} onPress={() => setScreen("product")} />
        <MenuButton title="Estoque" active={screen === "stock"} onPress={() => setScreen("stock")} />
        <MenuButton title="Venda" active={screen === "sale"} onPress={() => setScreen("sale")} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {screen === "home" && (
          <View>
            <Text style={styles.title}>Resumo Geral</Text>

            <View style={styles.cards}>
              <InfoCard label="Produtos cadastrados" value={products.length} />
              <InfoCard label="Itens em estoque" value={totalItems} />
              <InfoCard label="Vendas realizadas" value={sales.length} />
              <InfoCard label="Faturamento" value={formatMoney(totalRevenue)} />
            </View>

            <Text style={styles.paragraph}>
              Este aplicativo foi desenvolvido para auxiliar empresas do ramo de eletrônicos no controle de produtos,
              estoque e vendas, reduzindo erros manuais e evitando vendas de itens indisponíveis.
            </Text>

            <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
              <Text style={styles.buttonText}>Apagar todos os dados</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === "product" && (
          <View>
            <Text style={styles.title}>Cadastrar Produto</Text>

            <Input placeholder="Nome do produto" value={name} onChangeText={setName} />
            <Input placeholder="Categoria" value={category} onChangeText={setCategory} />
            <Input placeholder="Preço. Ex: 1999,90" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            <Input placeholder="Quantidade em estoque" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

            <TouchableOpacity style={styles.primaryButton} onPress={addProduct}>
              <Text style={styles.buttonText}>Salvar Produto</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === "stock" && (
          <View>
            <Text style={styles.title}>Estoque</Text>

            {products.length === 0 ? (
              <Text style={styles.empty}>Nenhum produto cadastrado.</Text>
            ) : (
              products.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemText}>Categoria: {item.category}</Text>
                  <Text style={styles.itemText}>Preço: {formatMoney(item.price)}</Text>
                  <Text style={item.quantity <= 3 ? styles.lowStock : styles.itemText}>
                    Quantidade: {item.quantity}
                  </Text>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(item.id)}>
                    <Text style={styles.deleteText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {screen === "sale" && (
          <View>
            <Text style={styles.title}>Registrar Venda</Text>

            {products.length === 0 ? (
              <Text style={styles.empty}>Cadastre um produto antes de registrar vendas.</Text>
            ) : (
              <>
                <Text style={styles.label}>Produto</Text>
                {products.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.productOption,
                      selectedProductId === item.id && styles.productOptionSelected
                    ]}
                    onPress={() => setSelectedProductId(item.id)}
                  >
                    <Text style={styles.productOptionText}>
                      {item.name} - {formatMoney(item.price)} - Estoque: {item.quantity}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Input
                  placeholder="Quantidade vendida"
                  value={saleQuantity}
                  onChangeText={setSaleQuantity}
                  keyboardType="numeric"
                />

                <TouchableOpacity style={styles.primaryButton} onPress={registerSale}>
                  <Text style={styles.buttonText}>Registrar Venda</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {screen === "sales" && (
          <View>
            <Text style={styles.title}>Vendas Realizadas</Text>

            {sales.length === 0 ? (
              <Text style={styles.empty}>Nenhuma venda registrada.</Text>
            ) : (
              sales.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{item.productName}</Text>
                  <Text style={styles.itemText}>Quantidade: {item.quantity}</Text>
                  <Text style={styles.itemText}>Valor unitário: {formatMoney(item.unitPrice)}</Text>
                  <Text style={styles.itemText}>Total: {formatMoney(item.total)}</Text>
                  <Text style={styles.itemText}>Data: {item.date}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuButton({ title, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.menuButton, active && styles.menuButtonActive]} onPress={onPress}>
      <Text style={[styles.menuButtonText, active && styles.menuButtonTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Input(props) {
  return <TextInput style={styles.input} placeholderTextColor="#64748b" {...props} />;
}

function InfoCard({ label, value }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9"
  },
  header: {
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 48
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold"
  },
  headerSubtitle: {
    color: "#cbd5e1",
    marginTop: 6
  },
  menu: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 8,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  menuButtonActive: {
    backgroundColor: "#0f172a"
  },
  menuButtonText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600"
  },
  menuButtonTextActive: {
    color: "#ffffff"
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 14
  },
  paragraph: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    lineHeight: 22,
    color: "#334155",
    marginTop: 12
  },
  cards: {
    gap: 10
  },
  infoCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a"
  },
  infoLabel: {
    color: "#64748b",
    marginTop: 4
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: "#0f172a"
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6
  },
  dangerButton: {
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold"
  },
  empty: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    color: "#64748b"
  },
  itemCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6
  },
  itemText: {
    color: "#334155",
    marginBottom: 4
  },
  lowStock: {
    color: "#dc2626",
    fontWeight: "bold",
    marginBottom: 4
  },
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#fee2e2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  deleteText: {
    color: "#dc2626",
    fontWeight: "bold"
  },
  label: {
    color: "#0f172a",
    fontWeight: "bold",
    marginBottom: 8
  },
  productOption: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  productOptionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe"
  },
  productOptionText: {
    color: "#0f172a"
  }
});
