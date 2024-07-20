const axios = require('axios');
const yargs = require('yargs');

// Set up command line arguments using yargs
const argv = yargs
    .option('name', {
        alias: 'n',
        description: 'Product name to search for',
        type: 'string',
    })
    .demandOption(['name'], 'Please provide the product name to search for')
    .help()
    .alias('help', 'h')
    .argv;

//Typically we save the adminToken in the .env but for simplisty of the project i left it here 
const shopifyUrl = 'https://anatta-test-store.myshopify.com/admin/api/2023-07/graphql.json';
const adminToken = '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';

// GraphQL query to fetch products and their variants based on the product name
const query = `
    query($name: String!) {
        products(first: 10, query: $name) {
            edges {
                node {
                    title
                    variants(first: 10) {
                        edges {
                            node {
                                title
                                price
                            }
                        }
                    }
                }
            }
        }
    }
`;

/**
 * Fetch products from Shopify based on the provided product name
 * @param {string} productName - The name of the product to search for
 * @returns {Promise<Array>} - A promise that resolves to an array of products
 */
async function fetchProducts(productName) {
    try {
        const response = await axios.post(
            shopifyUrl,
            {
                query: query,
                variables: { name: productName },
            },
            {
                headers: {
                    'X-Shopify-Access-Token': adminToken,
                    'Content-Type': 'application/json',
                },
            }
        );
        // Return the list of products
        return response.data.data.products.edges;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

/**
 * Sort product variants by price in ascending order
 * @param {Array} variants - Array of product variants
 * @returns {Array} - Sorted array of product variants
 */
function sortVariantsByPrice(variants) {
    return variants.sort((a, b) => parseFloat(a.node.price) - parseFloat(b.node.price));
}

/**
 * Main function to fetch and display products and their variants sorted by price
 */
async function main() {
    const productName = argv.name;
    const products = await fetchProducts(productName);

    // Check if any products were found
    if (!products || products.length === 0) {
        console.log('No products found matching the name:', productName);
        return;
    }

    // Iterate through each product and its variants, and print the sorted variants
    products.forEach(product => {
        const sortedVariants = sortVariantsByPrice(product.node.variants.edges);
        sortedVariants.forEach(variant => {
            console.log(`${product.node.title} - ${variant.node.title} - price $${variant.node.price}`);
        });
    });
}

// Run the main function
main();
