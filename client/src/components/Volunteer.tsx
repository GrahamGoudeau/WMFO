import * as React from "react";
export interface VolunteerProps { compiler: string; framework: string; }


export class Volunteer extends React.Component<VolunteerProps, undefined> {
    render() {
    	return (
    		<div>
    			<DJNameForm/>
    			<DateForm/>
    			<Reason/>
			</div>
		);
    }
}

export default class Reason extends React.Component<any, any> {
    constructor(props: any){
        super(props);
        this.state = { name: this.props.defaultName };
    }

    public handleOnChange(event: any) : void {
        this.setState({ name: event.target.value });
    }

    public render() {
        return (
            <div>
                <div>
                    <input 
                        onChange={ e => this.handleOnChange(e) }
                    />
                </div>
                <div>
                    { this.state.name }!
                </div>
            </div>
        );
    }
}



class DJNameForm extends React.Component<any, any> 
{
  constructor(props: any) {
    super(props);
    this.state = {name: "DJ"};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public handleChange(event:any) : void {
    this.setState({name: event.target.value});
  }

  public handleSubmit(event:any) : void {
    alert('A name was submitted: ' + this.state.name);
    event.preventDefault();
  }

  public render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          DJ Name:
          <br/>
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

class DateForm extends React.Component<any, any> 
{
  constructor(props: any) {
    super(props);
    this.state = {name: "DJ"};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public handleChange(event:any) : void {
    this.setState({name: event.target.value});
  }

  public handleSubmit(event:any) : void {
    alert('A name was submitted: ' + this.state.name);
    event.preventDefault();
  }

  public render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Date:
          <br/>
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}