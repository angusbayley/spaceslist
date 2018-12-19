Vue.component("page-layout", {
  props: ['listings'],
  template: `
    <div class="container">
        <div class="title">Hackney Wick spaces all-posts-in-one-page megalist 2000!!!!1</div>
            <table class="posts">
                <tr>
                    <th>give me the link then!!!!</th>
                    <th>well WHERE IS IT??</th>
                    <th>cheddar</th>
                    <th>posted to the internet at</th>
                </tr>
                <tr
                    v-for="item in listings"
                    v-bind[item]="item"
                    v-bind[key]="item.url">
                    <td>{{item.url}}</td>
                    <td>{{item.location}}</td>
                    <td>{{item.price}}</td>
                    <td>{{moment(item.posted_at).fromNow()}}</td>
                </tr>
            </table>
        </div>
    </div>`
})

const app = new Vue({
    el: "#app",
    data: {
        url: "https://europe-west1-hackney-wick-spaces-viewer.cloudfunctions.net/serveListings",
        listings: [],
    },
    methods: {
        getListings() {
            axios({method: "GET", url: this.url}).then(response => {
                console.log(response)
                this.listings = response.data;
            }, error => {
                console.log(error)
            });
        }
    },
    beforeMount() {
        console.log('beforeMount called')
        this.getListings()
    }
})