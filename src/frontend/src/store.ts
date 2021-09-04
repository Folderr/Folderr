import {createStore} from 'vuex';
import UserModule from './Stores/user.module';

export default createStore<Record<string, any>>({
	modules: {
		user: UserModule
	}
});
