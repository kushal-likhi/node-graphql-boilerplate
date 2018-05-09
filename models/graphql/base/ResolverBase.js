/**
 * Resolver base class
 * */

export default class ResolverBase {
	constructor(Type, description) {
		if (this.resolveRootNodeType) {
			this._type = this.resolveRootNodeType(Type.toGraphQLObjectType());
		}
		else this._type = Type.toGraphQLObjectType();
		this._description = description;
		return {
			type: this._type,
			description: this.description,
			args: this.args,
			resolve: this.resolve.bind(this)
		};
	}

	get type() {
		return this._type;
	}

	get description() {
		return this._description;
	}

}
